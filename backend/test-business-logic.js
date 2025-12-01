require('dotenv').config();
const supabase = require('./config/supabase');

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function pass(message) {
  console.log(`${colors.green}✅ PASS:${colors.reset} ${message}`);
}

function fail(message, error = '') {
  console.log(`${colors.red}❌ FAIL:${colors.reset} ${message}`);
  if (error) console.log(`   Error: ${error}`);
}

function info(message) {
  console.log(`${colors.cyan}ℹ️  INFO:${colors.reset} ${message}`);
}

function section(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

async function testBusinessLogic() {
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  try {
    section('UNIT TESTING - HARVESTING BUSINESS MODEL');

    // Test 1: Dashboard API
    totalTests++;
    info('Test 1: Testing Dashboard API...');
    try {
      const response = await fetch('http://localhost:5001/api/dashboard/stats');
      const data = await response.json();
      
      if (data.counts && data.harvesting && data.dealerRentals && data.combined) {
        pass('Dashboard API returns all required data sections');
        passedTests++;
        
        info(`  - Total Machines: ${data.counts.totalMachines}`);
        info(`  - Total Farmers: ${data.counts.totalFarmers}`);
        info(`  - Total Jobs: ${data.counts.totalJobs}`);
        info(`  - Combined Revenue: ₹${data.combined.totalRevenue}`);
        info(`  - Combined Profit: ₹${data.combined.totalProfit}`);
      } else {
        fail('Dashboard API missing required data sections');
        failedTests++;
      }
    } catch (error) {
      fail('Dashboard API test failed', error.message);
      failedTests++;
    }

    // Test 2: Direct Harvesting Profit Calculation
    totalTests++;
    info('\nTest 2: Testing Direct Harvesting Profit Calculation...');
    try {
      const { data: jobs, error } = await supabase
        .from('harvesting_jobs')
        .select('*');

      if (error) throw error;

      let totalRevenue = 0;
      let totalPaidToOwners = 0;
      let totalExpenses = 0;

      jobs.forEach(job => {
        totalRevenue += Number(job.amount_charged_to_farmer) || 0;
        totalPaidToOwners += Number(job.payment_to_owner) || 0;
        totalExpenses += Number(job.expenses_given) || 0;
      });

      const calculatedProfit = totalRevenue - totalPaidToOwners - totalExpenses;
      
      info(`  - Total Revenue: ₹${totalRevenue}`);
      info(`  - Total Paid to Owners: ₹${totalPaidToOwners}`);
      info(`  - Total Expenses: ₹${totalExpenses}`);
      info(`  - Calculated Profit: ₹${calculatedProfit}`);

      if (calculatedProfit >= 0) {
        pass('Profit calculation is valid (non-negative)');
        passedTests++;
      } else {
        fail('Profit calculation resulted in negative value');
        failedTests++;
      }
    } catch (error) {
      fail('Direct Harvesting profit calculation test failed', error.message);
      failedTests++;
    }

    // Test 3: Pending Payments Calculation
    totalTests++;
    info('\nTest 3: Testing Pending Payments Calculation...');
    try {
      const { data: jobs, error } = await supabase
        .from('harvesting_jobs')
        .select('*');

      if (error) throw error;

      let pendingFromFarmers = 0;
      let pendingToOwners = 0;

      jobs.forEach(job => {
        const charged = Number(job.amount_charged_to_farmer) || 0;
        const paid = Number(job.amount_paid_by_farmer) || 0;
        const ownerPayment = Number(job.payment_to_owner) || 0;

        pendingFromFarmers += (charged - paid);
        if (job.status === 'Completed' && ownerPayment === 0) {
          // Calculate expected owner payment
          const acres = Number(job.acres) || 0;
          const rate = Number(job.rate_per_acre) || 0;
          const expenses = Number(job.expenses_given) || 0;
          pendingToOwners += (acres * rate + expenses);
        }
      });

      info(`  - Pending from Farmers: ₹${pendingFromFarmers}`);
      info(`  - Pending to Owners: ₹${pendingToOwners}`);

      if (pendingFromFarmers >= 0 && pendingToOwners >= 0) {
        pass('Pending payments calculation is valid');
        passedTests++;
      } else {
        fail('Pending payments calculation has invalid values');
        failedTests++;
      }
    } catch (error) {
      fail('Pending payments test failed', error.message);
      failedTests++;
    }

    section('TESTING - DEALER RENTAL SYSTEM');

    // Test 4: Dealer Rental Commission Calculation
    totalTests++;
    info('Test 4: Testing Dealer Rental Commission Calculation...');
    try {
      const { data: rentals, error } = await supabase
        .from('machine_rentals')
        .select('*');

      if (error) throw error;

      let allCommissionsValid = true;
      let totalRevenue = 0;
      let totalCommission = 0;
      let totalOwnerAmount = 0;

      rentals.forEach(rental => {
        const total = Number(rental.total_amount) || 0;
        const commission = Number(rental.commission_amount) || 0;
        const ownerAmount = Number(rental.owner_amount) || 0;
        const commissionPct = Number(rental.commission_percentage) || 0;

        totalRevenue += total;
        totalCommission += commission;
        totalOwnerAmount += ownerAmount;

        // Verify commission calculation
        const expectedCommission = (total * commissionPct) / 100;
        const expectedOwnerAmount = total - expectedCommission;

        if (Math.abs(commission - expectedCommission) > 0.01 || 
            Math.abs(ownerAmount - expectedOwnerAmount) > 0.01) {
          allCommissionsValid = false;
          info(`  ⚠️  Rental ID ${rental.id}: Commission mismatch`);
        }
      });

      info(`  - Total Revenue from Dealers: ₹${totalRevenue}`);
      info(`  - Total Commission Earned: ₹${totalCommission}`);
      info(`  - Total Owner Amount: ₹${totalOwnerAmount}`);
      info(`  - Profit Margin: ${((totalCommission / totalRevenue) * 100).toFixed(2)}%`);

      if (allCommissionsValid) {
        pass('All rental commission calculations are correct');
        passedTests++;
      } else {
        fail('Some rental commission calculations are incorrect');
        failedTests++;
      }
    } catch (error) {
      fail('Dealer rental commission test failed', error.message);
      failedTests++;
    }

    // Test 5: Rental Payments Tracking
    totalTests++;
    info('\nTest 5: Testing Rental Payments Tracking...');
    try {
      const { data: rentals, error: rentalsError } = await supabase
        .from('machine_rentals')
        .select('id, total_amount, status');

      if (rentalsError) throw rentalsError;

      const { data: payments, error: paymentsError } = await supabase
        .from('rental_payments')
        .select('rental_id, amount_paid');

      if (paymentsError) throw paymentsError;

      let pendingAmount = 0;
      let paidAmount = 0;

      rentals.forEach(rental => {
        const totalAmount = Number(rental.total_amount) || 0;
        const rentalPayments = payments.filter(p => p.rental_id === rental.id);
        const totalPaid = rentalPayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
        
        paidAmount += totalPaid;
        pendingAmount += (totalAmount - totalPaid);
      });

      info(`  - Total Amount Paid: ₹${paidAmount}`);
      info(`  - Total Amount Pending: ₹${pendingAmount}`);

      if (pendingAmount >= 0) {
        pass('Rental payment tracking is consistent');
        passedTests++;
      } else {
        fail('Rental payment tracking has inconsistencies (negative pending)');
        failedTests++;
      }
    } catch (error) {
      fail('Rental payments tracking test failed', error.message);
      failedTests++;
    }

    section('TESTING - DATA INTEGRITY');

    // Test 6: Machine Assignment Conflicts
    totalTests++;
    info('Test 6: Testing Machine Assignment Conflicts...');
    try {
      const { data: activeJobs, error: jobsError } = await supabase
        .from('harvesting_jobs')
        .select('machine_id, start_date, end_date, status')
        .in('status', ['In Progress', 'Scheduled']);

      const { data: activeRentals, error: rentalsError } = await supabase
        .from('machine_rentals')
        .select('machine_id, start_date, end_date, status')
        .eq('status', 'Active');

      if (jobsError || rentalsError) throw new Error('Failed to fetch active assignments');

      let conflicts = 0;
      const allAssignments = [
        ...(activeJobs || []).map(j => ({ ...j, type: 'job' })),
        ...(activeRentals || []).map(r => ({ ...r, type: 'rental' }))
      ];

      // Check for overlapping assignments
      for (let i = 0; i < allAssignments.length; i++) {
        for (let j = i + 1; j < allAssignments.length; j++) {
          const a1 = allAssignments[i];
          const a2 = allAssignments[j];

          if (a1.machine_id === a2.machine_id) {
            const start1 = new Date(a1.start_date);
            const end1 = new Date(a1.end_date);
            const start2 = new Date(a2.start_date);
            const end2 = new Date(a2.end_date);

            if ((start1 <= end2 && end1 >= start2)) {
              conflicts++;
              info(`  ⚠️  Conflict: Machine ${a1.machine_id} assigned to ${a1.type} and ${a2.type}`);
            }
          }
        }
      }

      if (conflicts === 0) {
        pass('No machine assignment conflicts detected');
        passedTests++;
      } else {
        fail(`Found ${conflicts} machine assignment conflicts`);
        failedTests++;
      }
    } catch (error) {
      fail('Machine assignment conflict test failed', error.message);
      failedTests++;
    }

    // Test 7: Foreign Key Integrity
    totalTests++;
    info('\nTest 7: Testing Foreign Key Integrity...');
    try {
      let integrityIssues = 0;

      // Check machines have valid owners
      const { data: machines, error: machinesError } = await supabase
        .from('machines')
        .select('id, owner_id');

      const { data: owners, error: ownersError } = await supabase
        .from('machine_owners')
        .select('id');

      if (machinesError || ownersError) throw new Error('Failed to fetch machines/owners');

      const ownerIds = owners.map(o => o.id);
      machines.forEach(machine => {
        if (!ownerIds.includes(machine.owner_id)) {
          integrityIssues++;
          info(`  ⚠️  Machine ${machine.id} has invalid owner_id`);
        }
      });

      // Check jobs have valid farmers and machines
      const { data: jobs, error: jobsError } = await supabase
        .from('harvesting_jobs')
        .select('id, farmer_id, machine_id');

      const { data: farmers, error: farmersError } = await supabase
        .from('farmers')
        .select('id');

      if (jobsError || farmersError) throw new Error('Failed to fetch jobs/farmers');

      const farmerIds = farmers.map(f => f.id);
      const machineIds = machines.map(m => m.id);

      jobs.forEach(job => {
        if (!farmerIds.includes(job.farmer_id)) {
          integrityIssues++;
          info(`  ⚠️  Job ${job.id} has invalid farmer_id`);
        }
        if (!machineIds.includes(job.machine_id)) {
          integrityIssues++;
          info(`  ⚠️  Job ${job.id} has invalid machine_id`);
        }
      });

      if (integrityIssues === 0) {
        pass('All foreign key relationships are valid');
        passedTests++;
      } else {
        fail(`Found ${integrityIssues} foreign key integrity issues`);
        failedTests++;
      }
    } catch (error) {
      fail('Foreign key integrity test failed', error.message);
      failedTests++;
    }

    // Test 8: Combined Business Overview
    totalTests++;
    info('\nTest 8: Testing Combined Business Overview...');
    try {
      const response = await fetch('http://localhost:5001/api/dashboard/stats');
      const data = await response.json();

      const harvestingProfit = data.harvesting?.profit || 0;
      const rentalProfit = data.dealerRentals?.totalProfit || 0;
      const combinedProfit = data.combined?.totalProfit || 0;

      const expectedCombined = harvestingProfit + rentalProfit;
      const difference = Math.abs(combinedProfit - expectedCombined);

      info(`  - Harvesting Profit: ₹${harvestingProfit}`);
      info(`  - Rental Profit: ₹${rentalProfit}`);
      info(`  - Expected Combined: ₹${expectedCombined}`);
      info(`  - Actual Combined: ₹${combinedProfit}`);
      info(`  - Difference: ₹${difference}`);

      if (difference < 0.01) {
        pass('Combined business overview calculation is accurate');
        passedTests++;
      } else {
        fail('Combined business overview has calculation mismatch');
        failedTests++;
      }
    } catch (error) {
      fail('Combined business overview test failed', error.message);
      failedTests++;
    }

    // Final Summary
    section('TEST SUMMARY');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%\n`);

    if (failedTests === 0) {
      console.log(`${colors.green}🎉 All tests passed! Your business model is working correctly.${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  Some tests failed. Please review the issues above.${colors.reset}\n`);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Fatal error during testing:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the tests
console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║         HARVESTING BUSINESS MODEL - UNIT TESTING           ║
║                    Complete Test Suite                     ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

testBusinessLogic()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
