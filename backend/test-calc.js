const supabase = require('./config/supabase');

async function testDashboard() {
  try {
    // Get all jobs
    const { data: allJobs, error: jobsError } = await supabase
      .from('harvesting_jobs')
      .select('id, total_amount, hours, rate_per_hour, machine_id, machines!inner(owner_rate_per_hour)');
    
    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return;
    }

    console.log('\n=== HARVESTING JOBS ===');
    console.log('Total jobs:', allJobs?.length || 0);
    
    let totalRevenue = 0;
    let totalHoursFromJobs = 0;
    let totalOwnerCost = 0;
    
    allJobs?.forEach(job => {
      const revenue = parseFloat(job.total_amount || 0);
      const hours = parseFloat(job.hours || 0);
      const ownerRate = parseFloat(job.machines?.owner_rate_per_hour || 0);
      const ownerCost = hours * ownerRate;
      
      console.log(`Job ${job.id}:`);
      console.log(`  Revenue: ₹${revenue}`);
      console.log(`  Hours: ${hours}`);
      console.log(`  Owner Rate: ₹${ownerRate}/hr`);
      console.log(`  Owner Cost: ₹${ownerCost}`);
      
      totalRevenue += revenue;
      totalHoursFromJobs += hours;
      totalOwnerCost += ownerCost;
    });
    
    const harvestingProfit = totalRevenue - totalOwnerCost;
    
    console.log('\n=== HARVESTING TOTALS ===');
    console.log('Total Revenue from Farmers: ₹' + totalRevenue.toFixed(2));
    console.log('Total Hours: ' + totalHoursFromJobs.toFixed(2));
    console.log('Total Owner Cost: ₹' + totalOwnerCost.toFixed(2));
    console.log('Harvesting Profit: ₹' + harvestingProfit.toFixed(2));

    // Get all rentals
    const { data: allRentals, error: rentalsError } = await supabase
      .from('machine_rentals')
      .select('id, total_amount_charged, total_cost_to_owner, profit_margin, total_hours_used');
    
    if (rentalsError) {
      console.error('Error fetching rentals:', rentalsError);
      return;
    }

    console.log('\n=== DEALER RENTALS ===');
    console.log('Total rentals:', allRentals?.length || 0);
    
    let totalDealerRevenue = 0;
    let totalDealerOwnerCost = 0;
    let totalRentalProfit = 0;
    let totalRentalHours = 0;
    
    allRentals?.forEach(rental => {
      const revenue = parseFloat(rental.total_amount_charged || 0);
      const ownerCost = parseFloat(rental.total_cost_to_owner || 0);
      const profit = parseFloat(rental.profit_margin || 0);
      const hours = parseFloat(rental.total_hours_used || 0);
      
      console.log(`Rental ${rental.id}:`);
      console.log(`  Revenue from Dealer: ₹${revenue}`);
      console.log(`  Cost to Owner: ₹${ownerCost}`);
      console.log(`  Stored Profit: ₹${profit}`);
      console.log(`  Hours: ${hours}`);
      console.log(`  Calculated Profit: ₹${(revenue - ownerCost).toFixed(2)}`);
      
      totalDealerRevenue += revenue;
      totalDealerOwnerCost += ownerCost;
      totalRentalProfit += profit;
      totalRentalHours += hours;
    });
    
    console.log('\n=== RENTAL TOTALS ===');
    console.log('Total Revenue from Dealers: ₹' + totalDealerRevenue.toFixed(2));
    console.log('Total Rental Hours: ' + totalRentalHours.toFixed(2));
    console.log('Total Owner Cost: ₹' + totalDealerOwnerCost.toFixed(2));
    console.log('Rental Profit (from stored): ₹' + totalRentalProfit.toFixed(2));
    console.log('Rental Profit (calculated): ₹' + (totalDealerRevenue - totalDealerOwnerCost).toFixed(2));

    console.log('\n=== COMBINED TOTALS ===');
    const combinedRevenue = totalRevenue + totalDealerRevenue;
    const combinedHours = totalHoursFromJobs + totalRentalHours;
    const combinedProfit = harvestingProfit + totalRentalProfit;
    
    console.log('Combined Revenue: ₹' + combinedRevenue.toFixed(2));
    console.log('Combined Hours: ' + combinedHours.toFixed(2));
    console.log('Combined Profit: ₹' + combinedProfit.toFixed(2));
    console.log('\nFormula: Profit = (Revenue from Farmers - Owner Cost) + (Revenue from Dealers - Owner Cost)');
    console.log('         ₹' + combinedProfit.toFixed(2) + ' = (₹' + totalRevenue.toFixed(2) + ' - ₹' + totalOwnerCost.toFixed(2) + ') + (₹' + totalDealerRevenue.toFixed(2) + ' - ₹' + totalDealerOwnerCost.toFixed(2) + ')');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

testDashboard();
