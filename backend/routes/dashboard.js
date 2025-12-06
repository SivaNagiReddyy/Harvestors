const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { machine_id, village } = req.query;
    
    // ============================================
    // SECTION 1: MACHINE OWNERSHIP MANAGEMENT
    // ============================================
    const { count: totalMachineOwners } = await supabase
      .from('machine_owners')
      .select('*', { count: 'exact', head: true });

    // Get total machines - using data fetch instead of count
    let machinesQuery = supabase.from('machines').select('id');
    if (machine_id) {
      machinesQuery = machinesQuery.eq('id', machine_id);
    }
    const { data: allMachines, error: machinesError } = await machinesQuery;
    
    if (machinesError) {
      console.error('❌ Error fetching machines:', machinesError);
      console.error('Error details:', JSON.stringify(machinesError, null, 2));
    } else {
      console.log('✅ Machines data fetched successfully');
      console.log('Number of machines:', allMachines?.length);
      console.log('Machine IDs:', allMachines?.map(m => m.id));
    }
    
    const totalMachines = allMachines?.length || 0;

    // ============================================
    // SECTION 2: DIRECT HARVESTING FOR FARMERS
    // ============================================
    const { count: totalFarmers } = await supabase
      .from('farmers')
      .select('*', { count: 'exact', head: true });

    let jobsQuery = supabase.from('harvesting_jobs').select('*', { count: 'exact', head: true });
    if (machine_id) {
      jobsQuery = jobsQuery.eq('machine_id', machine_id);
    }
    const { count: totalJobs } = await jobsQuery;

    // ============================================
    // SECTION 3: DEALER RENTAL SYSTEM
    // ============================================
    const { count: totalDealers } = await supabase
      .from('dealers')
      .select('*', { count: 'exact', head: true });

    let rentalsQuery = supabase.from('machine_rentals').select('*, dealer:dealers!inner(village_name)', { count: 'exact', head: true });
    if (machine_id) {
      rentalsQuery = rentalsQuery.eq('machine_id', machine_id);
    }
    if (village) {
      rentalsQuery = rentalsQuery.eq('dealer.village_name', village);
    }
    const { count: totalRentals } = await rentalsQuery;

    let activeRentalsQuery = supabase.from('machine_rentals').select('*, dealer:dealers!inner(village_name)', { count: 'exact', head: true }).eq('status', 'Active');
    if (machine_id) {
      activeRentalsQuery = activeRentalsQuery.eq('machine_id', machine_id);
    }
    if (village) {
      activeRentalsQuery = activeRentalsQuery.eq('dealer.village_name', village);
    }
    const { count: activeRentals } = await activeRentalsQuery;

    // Get all jobs with farmer payment information
    let jobsWithPaymentsQuery = supabase
      .from('harvesting_jobs')
      .select(`
        id,
        farmer_id,
        machine_id,
        total_amount,
        hours,
        rate_per_hour,
        advance_from_farmer,
        discount_to_farmer,
        net_amount_from_farmer,
        farmers!inner(village)
      `);
    if (machine_id) {
      jobsWithPaymentsQuery = jobsWithPaymentsQuery.eq('machine_id', machine_id);
    }
    if (village) {
      jobsWithPaymentsQuery = jobsWithPaymentsQuery.eq('farmers.village', village);
    }
    const { data: allJobsWithPayments } = await jobsWithPaymentsQuery;

    // Get payments from farmers
    let farmerPaymentsQuery = supabase
      .from('payments')
      .select('farmer_id, amount, job_id, machine_id')
      .eq('type', 'From Farmer')
      .eq('status', 'Completed');
    if (machine_id) {
      farmerPaymentsQuery = farmerPaymentsQuery.eq('machine_id', machine_id);
    }
    const { data: farmerPayments } = await farmerPaymentsQuery;

    // Calculate completed jobs (where farmer has paid in full)
    let completedJobsCount = 0;
    let pendingJobsCount = 0;

    allJobsWithPayments?.forEach(job => {
      const jobAmount = parseFloat(job.total_amount) || (parseFloat(job.hours || 0) * parseFloat(job.rate_per_hour || 0));
      const advance = parseFloat(job.advance_from_farmer || 0);
      
      // Sum up all payments for this job
      const paymentsForJob = farmerPayments?.filter(p => p.job_id === job.id || p.farmer_id === job.farmer_id)
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
      
      const totalPaid = advance + paymentsForJob;
      
      if (totalPaid >= jobAmount) {
        completedJobsCount++;
      } else {
        pendingJobsCount++;
      }
    });

    // Financial statistics - Total already paid to owners (payments only, not including what's still owed)
    // Filter by business_source = 'harvesting' to separate from rental payments
    const { data: paymentsToOwners } = await supabase
      .from('payments')
      .select('amount')
      .eq('type', 'To Machine Owner')
      .eq('status', 'Completed')
      .eq('business_source', 'harvesting');

    const paymentsTotal = parseFloat((paymentsToOwners?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0).toFixed(2));

    // Get total expenses given (these are also paid out, separate from owner payments)
    let expensesTotal = 0;
    try {
      let expensesQuery = supabase.from('daily_expenses').select('amount');
      if (machine_id) {
        expensesQuery = expensesQuery.eq('machine_id', machine_id);
      }
      const { data: expensesData } = await expensesQuery;
      expensesTotal = parseFloat((expensesData?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0).toFixed(2));
    } catch (expenseError) {
      console.log('Expenses table not found or error:', expenseError.message);
      expensesTotal = 0;
    }

    // Total ALREADY paid to owners (this is what we've paid so far)
    const totalAlreadyPaidToOwners = parseFloat((paymentsTotal + expensesTotal).toFixed(2));

    console.log('Dashboard - Total Already Paid to Owners:', {
      paymentsTotal,
      expensesTotal,
      totalAlreadyPaidToOwners
    });

    // Calculate Total Revenue from all jobs (not just payments received)
    // Revenue and profit use GROSS (no discounts)
    let revenueQuery = supabase.from('harvesting_jobs').select('total_amount, hours, rate_per_hour, farmers!inner(village)');
    if (machine_id) {
      revenueQuery = revenueQuery.eq('machine_id', machine_id);
    }
    if (village) {
      revenueQuery = revenueQuery.eq('farmers.village', village);
    }
    const { data: allJobsForRevenue } = await revenueQuery;

    const totalRevenue = parseFloat((allJobsForRevenue?.reduce((sum, job) => {
      const grossAmount = parseFloat(job.total_amount) || (parseFloat(job.hours || 0) * parseFloat(job.rate_per_hour || 0));
      return sum + grossAmount;
    }, 0) || 0).toFixed(2));

    // Calculate total hours worked
    const totalHours = parseFloat((allJobsForRevenue?.reduce((sum, job) => {
      return sum + parseFloat(job.hours || 0);
    }, 0) || 0).toFixed(2));
    console.log('Dashboard - Total Hours:', { totalHours, sampleHours: allJobsForRevenue?.[0]?.hours });


    // Calculate pending to owners from jobs
    // Jobs don't have machine_owner_id directly, need to join through machines
    let ownerJobsQuery = supabase
      .from('harvesting_jobs')
      .select(`
        machine_id,
        total_amount,
        hours,
        rate_per_hour,
        discount_from_owner,
        discount_to_farmer,
        net_amount_to_owner,
        net_amount_from_farmer,
        machines!inner(id, machine_owner_id, owner_rate_per_hour),
        farmers!inner(village)
      `);
    if (machine_id) {
      ownerJobsQuery = ownerJobsQuery.eq('machine_id', machine_id);
    }
    if (village) {
      ownerJobsQuery = ownerJobsQuery.eq('farmers.village', village);
    }
    const { data: allJobs, error: jobsError } = await ownerJobsQuery;

    if (jobsError) {
      console.error('❌ Error fetching jobs for dashboard:', jobsError);
    }

    console.log('Dashboard - All Jobs for owner calculation:', {
      totalJobs: allJobs?.length,
      sampleJob: allJobs?.[0],
      sampleMachine: allJobs?.[0]?.machines
    });

    // ============================================
    // CALCULATE WHAT WE NEED TO PAY TO OWNERS
    // Logic: hours worked × owner_rate_per_hour (from machines table)
    // This is what we OWE them based on agreed rates
    // ============================================
    
    // Get all machines to access owner_rate_per_hour
    let machinesForOwnerQuery = supabase.from('machines').select('id, machine_owner_id, owner_rate_per_hour');
    if (machine_id) {
      machinesForOwnerQuery = machinesForOwnerQuery.eq('id', machine_id);
    }
    const { data: machines } = await machinesForOwnerQuery;

    // Get all expenses for expense-by-machine calculation
    let allExpensesQuery = supabase.from('daily_expenses').select('machine_id, amount');
    if (machine_id) {
      allExpensesQuery = allExpensesQuery.eq('machine_id', machine_id);
    }
    const { data: allExpenses } = await allExpensesQuery;

    // Calculate expenses by machine
    const machineExpenses = {};
    allExpenses?.forEach(expense => {
      if (expense.machine_id) {
        machineExpenses[expense.machine_id] = parseFloat(((machineExpenses[expense.machine_id] || 0) + parseFloat(expense.amount || 0)).toFixed(2));
      }
    });

    // Calculate expenses by owner
    const ownerExpenses = {};
    machines?.forEach(machine => {
      if (machine.machine_owner_id && machineExpenses[machine.id]) {
        ownerExpenses[machine.machine_owner_id] = parseFloat(((ownerExpenses[machine.machine_owner_id] || 0) + machineExpenses[machine.id]).toFixed(2));
      }
    });

    // STEP 1: Calculate total earnings from DIRECT HARVESTING JOBS
    // Calculate based on: hours × owner_rate_per_hour (from machines table)
    // This matches the Machine Owners page calculation
    const ownerEarningsFromJobs = {};
    
    allJobs?.forEach(job => {
      const ownerId = job.machines?.machine_owner_id;
      const hours = parseFloat(job.hours || 0);
      // Get owner rate from the machines table (current rate)
      const ownerRate = parseFloat(job.machines?.owner_rate_per_hour || 0);
      const earnings = hours * ownerRate;
      
      if (ownerId && earnings > 0) {
        ownerEarningsFromJobs[ownerId] = parseFloat(((ownerEarningsFromJobs[ownerId] || 0) + earnings).toFixed(2));
      }
    });

    // STEP 2: Calculate total earnings from RENTAL JOBS
    // Use total_cost_to_owner from rentals (calculated at time of rental)
    let rentalsForOwnerCalcQuery = supabase
      .from('machine_rentals')
      .select('machine_id, total_cost_to_owner, machines(machine_owner_id), dealer:dealers!inner(village_name)');
    if (machine_id) {
      rentalsForOwnerCalcQuery = rentalsForOwnerCalcQuery.eq('machine_id', machine_id);
    }
    if (village) {
      rentalsForOwnerCalcQuery = rentalsForOwnerCalcQuery.eq('dealer.village_name', village);
    }
    const { data: rentalData, error: rentalError } = await rentalsForOwnerCalcQuery;
    
    if (rentalError) {
      console.error('❌ Error fetching rentals:', rentalError);
    } else {
      console.log('✅ Rentals fetched:', rentalData?.length || 0);
    }

    const ownerEarningsFromRentals = {};
    rentalData?.forEach(rental => {
      const ownerId = rental.machines?.machine_owner_id;
      // Use total_cost_to_owner which was calculated when rental was created
      const earnings = parseFloat(rental.total_cost_to_owner || 0);
      
      if (ownerId && earnings > 0) {
        ownerEarningsFromRentals[ownerId] = parseFloat(((ownerEarningsFromRentals[ownerId] || 0) + earnings).toFixed(2));
      }
    });

    // STEP 3: Calculate TOTAL for HARVESTING ONLY (don't include rentals here)
    // Rentals will be calculated separately in the Dealer Rental section

    // STEP 4: Calculate what we've already paid to owners FOR HARVESTING
    let ownerPaymentsQuery = supabase
      .from('payments')
      .select('machine_owner_id, amount')
      .eq('type', 'To Machine Owner')
      .eq('status', 'Completed')
      .eq('business_source', 'harvesting'); // Only harvesting payments
    if (machine_id) {
      ownerPaymentsQuery = ownerPaymentsQuery.eq('machine_id', machine_id);
    }
    const { data: ownerPaymentData } = await ownerPaymentsQuery;

    const ownerPaidAmounts = {};
    ownerPaymentData?.forEach(payment => {
      if (payment.machine_owner_id) {
        ownerPaidAmounts[payment.machine_owner_id] = parseFloat(((ownerPaidAmounts[payment.machine_owner_id] || 0) + parseFloat(payment.amount || 0)).toFixed(2));
      }
    });

    // Add expenses to paid amounts (expenses are also money given to owners)
    Object.keys(ownerExpenses).forEach(ownerId => {
      ownerPaidAmounts[ownerId] = parseFloat(((ownerPaidAmounts[ownerId] || 0) + ownerExpenses[ownerId]).toFixed(2));
    });

    // STEP 5: Calculate TOTAL TO PAY for HARVESTING ONLY (jobs only, no rentals)
    let totalToPayToOwners = 0;
    let totalAlreadyPaid = 0;
    
    Object.keys(ownerEarningsFromJobs).forEach(ownerId => {
      const earned = ownerEarningsFromJobs[ownerId] || 0;
      const paid = ownerPaidAmounts[ownerId] || 0;
      totalToPayToOwners += earned;
      totalAlreadyPaid += paid;
    });

    totalToPayToOwners = parseFloat(totalToPayToOwners.toFixed(2));
    totalAlreadyPaid = parseFloat(totalAlreadyPaid.toFixed(2));
    const pendingToOwners = parseFloat((totalToPayToOwners - totalAlreadyPaid).toFixed(2));

    console.log('Dashboard - Owner Payment Calculation (HARVESTING ONLY):', {
      ownerEarningsFromJobs,
      ownerPaidAmounts,
      totalToPayToOwners,
      totalAlreadyPaid,
      pendingToOwners
    });

    console.log('Dashboard - Rental owner earnings (separate):', {
      ownerEarningsFromRentals
    });

    // Calculate pending from farmers using NET amounts (with discounts)
    const farmerGrossTotals = {};  // For revenue calculation (no discounts)
    const farmerNetTotals = {};    // For pending calculation (with discounts)
    const farmerPaid = {};
    
    allJobsWithPayments?.forEach(job => {
      if (job.farmer_id) {
        // Calculate GROSS amount (without discount - for revenue)
        const grossAmount = parseFloat(job.total_amount) || (parseFloat(job.hours || 0) * parseFloat(job.rate_per_hour || 0));
        
        // Calculate NET amount (with discount - for pending)
        const discount = parseFloat(job.discount_to_farmer || 0);
        const netAmount = parseFloat(job.net_amount_from_farmer || 0) || (grossAmount - discount);
        
        const advance = parseFloat(job.advance_from_farmer || 0);
        
        farmerGrossTotals[job.farmer_id] = parseFloat(((farmerGrossTotals[job.farmer_id] || 0) + grossAmount).toFixed(2));
        farmerNetTotals[job.farmer_id] = parseFloat(((farmerNetTotals[job.farmer_id] || 0) + netAmount).toFixed(2));
        farmerPaid[job.farmer_id] = parseFloat(((farmerPaid[job.farmer_id] || 0) + advance).toFixed(2));
      }
    });

    // Add payments from farmers
    farmerPayments?.forEach(payment => {
      if (payment.farmer_id) {
        farmerPaid[payment.farmer_id] = parseFloat(((farmerPaid[payment.farmer_id] || 0) + parseFloat(payment.amount || 0)).toFixed(2));
      }
    });

    // Calculate pending from farmers using NET amounts (with discounts)
    let pendingFromFarmers = 0;
    Object.keys(farmerNetTotals).forEach(farmerId => {
      const total = parseFloat((farmerNetTotals[farmerId] || 0).toFixed(2));
      const paid = parseFloat((farmerPaid[farmerId] || 0).toFixed(2));
      const pending = total - paid;
      console.log(`Farmer ${farmerId}: total(net)=₹${total}, paid=₹${paid}, pending=₹${pending}`);
      pendingFromFarmers = parseFloat((pendingFromFarmers + pending).toFixed(2));
    });

    // pendingFromFarmers is now net (with discounts)
    console.log('Dashboard - Pending from Farmers calculation:', {
      totalGrossFromFarmers: Object.values(farmerGrossTotals).reduce((a, b) => a + b, 0),
      totalNetFromFarmers: Object.values(farmerNetTotals).reduce((a, b) => a + b, 0),
      totalPaid: Object.values(farmerPaid).reduce((a, b) => a + b, 0),
      pendingFromFarmers
    });

    // ============================================
    // DEALER RENTAL FINANCIALS
    // ============================================
    // Get all rental agreements
    let rentalsFinanceQuery = supabase.from('machine_rentals').select('*, dealer:dealers!inner(village_name)');
    if (machine_id) {
      rentalsFinanceQuery = rentalsFinanceQuery.eq('machine_id', machine_id);
    }
    if (village) {
      rentalsFinanceQuery = rentalsFinanceQuery.eq('dealer.village_name', village);
    }
    const { data: allRentals } = await rentalsFinanceQuery;

    const totalDealerRevenue = parseFloat((allRentals?.reduce((sum, rental) => 
      sum + parseFloat(rental.total_amount_charged || 0), 0) || 0).toFixed(2));

    const totalOwnerCost = parseFloat((allRentals?.reduce((sum, rental) => 
      sum + parseFloat(rental.total_cost_to_owner || 0), 0) || 0).toFixed(2));

    const totalRentalProfit = parseFloat((allRentals?.reduce((sum, rental) => 
      sum + parseFloat(rental.profit_margin || 0), 0) || 0).toFixed(2));

    // Calculate total rental hours
    const totalRentalHours = parseFloat((allRentals?.reduce((sum, rental) => 
      sum + parseFloat(rental.total_hours_used || 0), 0) || 0).toFixed(2));
    console.log('Dashboard - Total Rental Hours:', { totalRentalHours, sampleRentalHours: allRentals?.[0]?.total_hours_used });

    // Calculate total paid by dealers (advance + payments)
    const totalAdvanceFromDealers = parseFloat((allRentals?.reduce((sum, rental) => 
      sum + parseFloat(rental.advance_paid || 0), 0) || 0).toFixed(2));

    // Get rental payments from dealers
    let rentalPayments = [];
    
    if (machine_id && allRentals) {
      // If machine_id filter is active, only get payments for rentals belonging to that machine
      const rentalIds = allRentals.map(r => r.id);
      if (rentalIds.length > 0) {
        const { data } = await supabase
          .from('rental_payments')
          .select('amount, rental_id')
          .in('rental_id', rentalIds);
        rentalPayments = data || [];
      }
      // If no rentals for this machine, rentalPayments stays empty []
    } else {
      // No machine filter - get all rental payments
      const { data } = await supabase.from('rental_payments').select('amount, rental_id');
      rentalPayments = data || [];
    }

    const totalRentalPayments = parseFloat((rentalPayments?.reduce((sum, p) => 
      sum + parseFloat(p.amount || 0), 0) || 0).toFixed(2));

    const totalPaidByDealers = parseFloat((totalAdvanceFromDealers + totalRentalPayments).toFixed(2));
    const pendingFromDealers = parseFloat((totalDealerRevenue - totalPaidByDealers).toFixed(2));

    // Calculate how much we've already paid to owners from rental business
    // Filter by business_source = 'rental' to separate from harvesting payments
    let rentalOwnerPaymentsQuery = supabase
      .from('payments')
      .select('amount, machine_id')
      .eq('type', 'To Machine Owner')
      .eq('business_source', 'rental');
    if (machine_id) {
      rentalOwnerPaymentsQuery = rentalOwnerPaymentsQuery.eq('machine_id', machine_id);
    }
    const { data: rentalOwnerPayments } = await rentalOwnerPaymentsQuery;

    console.log('Dashboard - Rental Owner Payments:', {
      count: rentalOwnerPayments?.length || 0,
      payments: rentalOwnerPayments,
      totalOwnerCost
    });
    
    // Filter payments that are for rental machines (approximate - you may want to add a source field to payments)
    const totalPaidToOwnersFromRentals = parseFloat((rentalOwnerPayments?.reduce((sum, p) => 
      sum + parseFloat(p.amount || 0), 0) || 0).toFixed(2));

    // Calculate pending to owners for rentals
    const pendingToOwnersFromRentals = parseFloat((totalOwnerCost - totalPaidToOwnersFromRentals).toFixed(2));

    console.log('Dashboard - Rental Pending to Owners:', {
      totalOwnerCost,
      totalPaidToOwnersFromRentals,
      pendingToOwnersFromRentals
    });

    // ============================================
    // COMBINED TOTALS
    // ============================================
    const combinedRevenue = parseFloat((totalRevenue + totalDealerRevenue).toFixed(2));
    
    // Profit calculation: Revenue - What we owe to owners
    const combinedProfit = parseFloat(((totalRevenue - totalToPayToOwners) + totalRentalProfit).toFixed(2));

    console.log('Dashboard - Final calculations:', {
      totalRevenue,
      totalToPayToOwners,
      totalAlreadyPaid,
      pendingToOwners,
      combinedProfit
    });

    // Recent jobs
    const { data: recentJobs } = await supabase
      .from('harvesting_jobs')
      .select(`
        *,
        field:fields(*),
        farmer:farmers(*),
        machine_owner:machine_owners(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Recent payments
    const { data: recentPayments } = await supabase
      .from('payments')
      .select(`
        *,
        machine_owner:machine_owners(*),
        farmer:farmers(*),
        job:harvesting_jobs(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    const responseData = {
      counts: {
        totalMachineOwners: totalMachineOwners || 0,
        totalMachines: totalMachines || 0,
        totalFarmers: totalFarmers || 0,
        totalJobs: totalJobs || 0,
        completedJobs: completedJobsCount || 0,
        pendingJobs: pendingJobsCount || 0,
        totalDealers: totalDealers || 0,
        totalRentals: totalRentals || 0,
        activeRentals: activeRentals || 0
      },
      harvesting: {
        totalRevenue, // Total revenue from farmer jobs
        totalHours, // Total hours worked
        totalPaidToOwners: totalAlreadyPaid, // Total already paid to owners (payments + expenses)
        totalToPayToOwners, // Total amount we need to pay to owners (hours × owner_rate)
        pendingToOwners, // What we still owe to owners (totalToPayToOwners - totalAlreadyPaid)
        pendingFromFarmers, // What farmers still owe us
        profit: totalRevenue - totalToPayToOwners // Our profit (revenue - owner cost)
      },
      dealerRentals: {
        totalRevenue: totalDealerRevenue, // Total charged to dealers
        totalHours: totalRentalHours, // Total rental hours
        totalOwnerCost: totalOwnerCost, // Total to pay owners
        totalProfit: totalRentalProfit, // Profit from dealer rentals
        totalPaidByDealers, // Amount received from dealers
        pendingFromDealers, // Amount pending from dealers
        pendingToOwners: pendingToOwnersFromRentals // Amount pending to owners from rentals
      },
      combined: {
        totalRevenue: combinedRevenue,
        totalHours: totalHours + totalRentalHours, // Combined hours from both businesses
        totalProfit: combinedProfit
      },
      recentJobs: recentJobs || [],
      recentPayments: recentPayments || []
    };
    
    console.log('Dashboard - API Response Hours:', {
      harvestingHours: totalHours,
      rentalHours: totalRentalHours,
      combinedHours: totalHours + totalRentalHours
    });
    
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
