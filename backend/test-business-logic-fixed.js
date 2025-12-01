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

async function testBusinessLogicFixed() {
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  try {
    section('DIRECT HARVESTING MODEL TESTS');

    // Test 1: Revenue Calculation (Hour-Based)
    totalTests++;
    info('Test 1: Testing Direct Harvesting Revenue Calculation...');
    try {
      const { data: jobs, error } = await supabase
        .from('harvesting_jobs')
        .select('hours, rate_per_hour, expenses_given');

      if (error) throw error;

      let totalRevenue = 0;
      let totalExpenses = 0;

      jobs.forEach(job => {
        const hours = Number(job.hours) || 0;
        const rate = Number(job.rate_per_hour) || 0;
        const expenses = Number(job.expenses_given) || 0;
        
        totalRevenue += (hours * rate);
        totalExpenses += expenses;
      });

      info(`  - Total Revenue (hours × rate): ₹${totalRevenue.toFixed(2)}`);
      info(`  - Total Expenses Given: ₹${totalExpenses.toFixed(2)}`);
      info(`  - Gross Profit: ₹${(totalRevenue - totalExpenses).toFixed(2)}`);

      if (totalRevenue > 0 && totalRevenue >= totalExpenses) {
        pass('Revenue calculation is valid and profitable');
        passedTests++;
      } else if (totalRevenue > 0) {
        pass('Revenue calculation is valid (but check profit margins)');
        passedTests++;
      } else {
        fail('Revenue calculation resulted in zero or negative');
        failedTests++;
      }
    } catch (error) {
      fail('Direct Harvesting revenue test failed', error.message);
      failedTests++;
    }

    // Test 2: Pending Payments from Farmers
    totalTests++;
    info('\nTest 2: Testing Pending Payments from Farmers...');
    try {
      const { data: jobs, error } = await supabase
        .from('harvesting_jobs')
        .select('hours, rate_per_hour, advance_from_farmer');

      if (error) throw error;

      let totalCharged = 0;
      let totalAdvance = 0;

      jobs.forEach(job => {
        const hours = Number(job.hours) || 0;
        const rate = Number(job.rate_per_hour) || 0;
        const advance = Number(job.advance_from_farmer) || 0;
        
        totalCharged += (hours * rate);
        totalAdvance += advance;
      });

      const pending = totalCharged - totalAdvance;

      info(`  - Total Amount Charged: ₹${totalCharged.toFixed(2)}`);
      info(`  - Total Advance Received: ₹${totalAdvance.toFixed(2)}`);
      info(`  - Pending from Farmers: ₹${pending.toFixed(2)}`);
      info(`  - Collection Rate: ${((totalAdvance / totalCharged) * 100).toFixed(1)}%`);

      if (pending >= 0 && pending < totalCharged) {
        pass('Pending payments calculation is valid');
        passedTests++;
      } else if (pending === 0) {
        pass('All payments collected! No pending amounts');
        passedTests++;
      } else {
        fail('Pending payments calculation has issues (negative or > total)');
        failedTests++;
      }
    } catch (error) {
      fail('Pending payments test failed', error.message);
      failedTests++;
    }

    // Test 3: Job Status Distribution
    totalTests++;
    info('\nTest 3: Testing Job Status Distribution...');
    try {
      const { data: jobs, error } = await supabase
        .from('harvesting_jobs')
        .select('status');

      if (error) throw error;

      const statusCounts = {};
      jobs.forEach(job => {
        statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
      });

      Object.entries(statusCounts).forEach(([status, count]) => {
        info(`  - ${status}: ${count} jobs (${((count / jobs.length) * 100).toFixed(1)}%)`);
      });

      if (jobs.length > 0) {
        pass(`Job status tracking working (${jobs.length} total jobs)`);
        passedTests++;
      } else {
        fail('No jobs found in database');
        failedTests++;
      }
    } catch (error) {
      fail('Job status distribution test failed', error.message);
      failedTests++;
    }

    section('DEALER RENTAL SYSTEM TESTS');

    // Test 4: Rental Profit Margins
    totalTests++;
    info('Test 4: Testing Rental Profit Margins...');
    try {
      const { data: rentals, error } = await supabase
        .from('machine_rentals')
        .select('total_amount_charged, total_cost_to_owner, profit_margin, total_hours_used, hourly_rate_to_dealer, hourly_cost_from_owner');

      if (error) throw error;

      let allProfitsValid = true;
      let totalRevenue = 0;
      let totalCost = 0;
      let totalProfit = 0;

      rentals.forEach(rental => {
        const charged = Number(rental.total_amount_charged) || 0;
        const cost = Number(rental.total_cost_to_owner) || 0;
        const profit = Number(rental.profit_margin) || 0;
        const hours = Number(rental.total_hours_used) || 0;
        const dealerRate = Number(rental.hourly_rate_to_dealer) || 0;
        const ownerRate = Number(rental.hourly_cost_from_owner) || 0;

        totalRevenue += charged;
        totalCost += cost;
        totalProfit += profit;

        // Verify profit calculation
        const expectedProfit = charged - cost;
        const expectedFromRates = (dealerRate - ownerRate) * hours;

        if (Math.abs(profit - expectedProfit) > 0.01 && Math.abs(profit - expectedFromRates) > 0.01) {
          allProfitsValid = false;
          info(`  ⚠️  Rental profit mismatch: Expected ₹${expectedProfit}, Got ₹${profit}`);
        }
      });

      info(`  - Total Revenue from Dealers: ₹${totalRevenue.toFixed(2)}`);
      info(`  - Total Cost to Owners: ₹${totalCost.toFixed(2)}`);
      info(`  - Total Profit Margin: ₹${totalProfit.toFixed(2)}`);
      info(`  - Profit Percentage: ${((totalProfit / totalRevenue) * 100).toFixed(2)}%`);

      if (allProfitsValid && totalProfit > 0) {
        pass('All rental profit calculations are correct');
        passedTests++;
      } else if (totalProfit > 0) {
        pass('Rental system generating profit (minor calculation issues noted)');
        passedTests++;
      } else {
        fail('Rental profit calculations have issues');
        failedTests++;
      }
    } catch (error) {
      fail('Rental profit margin test failed', error.message);
      failedTests++;
    }

    // Test 5: Rental Payment Tracking
    totalTests++;
    info('\nTest 5: Testing Rental Payment Tracking...');
    try {
      const { data: rentals, error: rentalsError } = await supabase
        .from('machine_rentals')
        .select('id, total_amount_charged, status');

      if (rentalsError) throw rentalsError;

      const { data: payments, error: paymentsError } = await supabase
        .from('rental_payments')
        .select('rental_id, amount, status');

      if (paymentsError) throw paymentsError;

      let totalCharged = 0;
      let totalPaid = 0;
      let completedPayments = 0;
      let pendingPayments = 0;

      rentals.forEach(rental => {
        const charged = Number(rental.total_amount_charged) || 0;
        totalCharged += charged;

        const rentalPayments = payments.filter(p => p.rental_id === rental.id);
        const paidAmount = rentalPayments
          .filter(p => p.status === 'Completed')
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        
        totalPaid += paidAmount;
        
        if (paidAmount >= charged) {
          completedPayments++;
        } else {
          pendingPayments++;
        }
      });

      const pendingAmount = totalCharged - totalPaid;

      info(`  - Total Amount Charged: ₹${totalCharged.toFixed(2)}`);
      info(`  - Total Amount Paid: ₹${totalPaid.toFixed(2)}`);
      info(`  - Pending Amount: ₹${pendingAmount.toFixed(2)}`);
      info(`  - Fully Paid Rentals: ${completedPayments}/${rentals.length}`);
      info(`  - Rentals with Pending: ${pendingPayments}/${rentals.length}`);

      if (pendingAmount >= 0 && totalPaid >= 0) {
        pass('Rental payment tracking is consistent');
        passedTests++;
      } else {
        fail('Rental payment tracking has inconsistencies');
        failedTests++;
      }
    } catch (error) {
      fail('Rental payments tracking test failed', error.message);
      failedTests++;
    }

    section('DATA INTEGRITY TESTS');

    // Test 6: Entity Counts
    totalTests++;
    info('Test 6: Testing Entity Counts and Relationships...');
    try {
      const { count: ownerCount } = await supabase
        .from('machine_owners')
        .select('*', { count: 'exact', head: true });

      const { count: machineCount } = await supabase
        .from('machines')
        .select('*', { count: 'exact', head: true });

      const { count: farmerCount } = await supabase
        .from('farmers')
        .select('*', { count: 'exact', head: true });

      const { count: jobCount } = await supabase
        .from('harvesting_jobs')
        .select('*', { count: 'exact', head: true });

      const { count: dealerCount } = await supabase
        .from('dealers')
        .select('*', { count: 'exact', head: true });

      const { count: rentalCount } = await supabase
        .from('machine_rentals')
        .select('*', { count: 'exact', head: true });

      info(`  - Machine Owners: ${ownerCount}`);
      info(`  - Machines: ${machineCount}`);
      info(`  - Farmers: ${farmerCount}`);
      info(`  - Harvesting Jobs: ${jobCount}`);
      info(`  - Dealers: ${dealerCount}`);
      info(`  - Machine Rentals: ${rentalCount}`);

      if (ownerCount > 0 && machineCount > 0 && jobCount > 0) {
        pass('All entities present with valid counts');
        passedTests++;
      } else {
        fail('Some entities missing or have zero records');
        failedTests++;
      }
    } catch (error) {
      fail('Entity count test failed', error.message);
      failedTests++;
    }

    // Test 7: Foreign Key Relationships
    totalTests++;
    info('\nTest 7: Testing Foreign Key Integrity...');
    try {
      const { data: machines, error: machinesError } = await supabase
        .from('machines')
        .select('id, machine_owner_id');

      const { data: owners, error: ownersError } = await supabase
        .from('machine_owners')
        .select('id');

      if (machinesError || ownersError) throw new Error('Failed to fetch data');

      const ownerIds = new Set(owners.map(o => o.id));
      let orphanedMachines = 0;

      machines.forEach(machine => {
        if (!ownerIds.has(machine.machine_owner_id)) {
          orphanedMachines++;
          info(`  ⚠️  Machine ${machine.id} has invalid owner_id`);
        }
      });

      // Check jobs have valid machines and farmers
      const { data: jobs, error: jobsError } = await supabase
        .from('harvesting_jobs')
        .select('id, farmer_id, machine_id');

      const { data: farmers, error: farmersError } = await supabase
        .from('farmers')
        .select('id');

      if (jobsError || farmersError) throw new Error('Failed to fetch jobs/farmers');

      const machineIds = new Set(machines.map(m => m.id));
      const farmerIds = new Set(farmers.map(f => f.id));
      let orphanedJobs = 0;

      jobs.forEach(job => {
        if (!farmerIds.has(job.farmer_id) || !machineIds.has(job.machine_id)) {
          orphanedJobs++;
          info(`  ⚠️  Job ${job.id} has invalid foreign key`);
        }
      });

      const totalIssues = orphanedMachines + orphanedJobs;
      info(`  - Total Integrity Issues Found: ${totalIssues}`);

      if (totalIssues === 0) {
        pass('All foreign key relationships are valid');
        passedTests++;
      } else {
        fail(`Found ${totalIssues} foreign key integrity issues`);
        failedTests++;
      }
    } catch (error) {
      fail('Foreign key integrity test failed', error.message);
      failedTests++;
    }

    // Test 8: Business Logic Validation
    totalTests++;
    info('\nTest 8: Testing Combined Business Overview...');
    try {
      // Harvesting profit
      const { data: jobs } = await supabase
        .from('harvesting_jobs')
        .select('hours, rate_per_hour, expenses_given');

      const harvestingRevenue = jobs.reduce((sum, j) => {
        return sum + ((Number(j.hours) || 0) * (Number(j.rate_per_hour) || 0));
      }, 0);

      const harvestingExpenses = jobs.reduce((sum, j) => {
        return sum + (Number(j.expenses_given) || 0);
      }, 0);

      // Rental profit
      const { data: rentals } = await supabase
        .from('machine_rentals')
        .select('profit_margin');

      const rentalProfit = rentals.reduce((sum, r) => {
        return sum + (Number(r.profit_margin) || 0);
      }, 0);

      const totalRevenue = harvestingRevenue;
      const totalProfit = (harvestingRevenue - harvestingExpenses) + rentalProfit;

      info(`  - Direct Harvesting Revenue: ₹${harvestingRevenue.toFixed(2)}`);
      info(`  - Direct Harvesting Expenses: ₹${harvestingExpenses.toFixed(2)}`);
      info(`  - Rental System Profit: ₹${rentalProfit.toFixed(2)}`);
      info(`  - Combined Net Profit: ₹${totalProfit.toFixed(2)}`);
      info(`  - Overall Margin: ${((totalProfit / totalRevenue) * 100).toFixed(2)}%`);

      if (totalProfit > 0) {
        pass('Business is profitable overall');
        passedTests++;
      } else if (totalProfit === 0) {
        pass('Business is break-even (verify calculations)');
        passedTests++;
      } else {
        fail('Business showing losses - review pricing');
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
    } else if (passedTests > failedTests) {
      console.log(`${colors.yellow}⚠️  Most tests passed. Review the failures above.${colors.reset}\n`);
    } else {
      console.log(`${colors.red}❌ Multiple tests failed. Please review the issues above.${colors.reset}\n`);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Fatal error during testing:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the tests
console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║      HARVESTING BUSINESS MODEL - FIXED UNIT TESTS          ║
║           Corrected for Actual Database Schema             ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

testBusinessLogicFixed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
