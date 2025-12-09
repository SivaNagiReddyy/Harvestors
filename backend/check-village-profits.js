const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkData() {
  // Get all jobs grouped by village
  const { data: jobs, error } = await supabase
    .from('harvesting_jobs')
    .select('*, farmers(village), machines(machine_number, owner_rate_per_hour)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // Group by village
  const byVillage = {};
  jobs.forEach(job => {
    const village = job.farmers?.village || 'Unknown';
    if (!byVillage[village]) {
      byVillage[village] = { revenue: 0, ownerCost: 0, profit: 0, jobs: 0 };
    }
    byVillage[village].revenue += parseFloat(job.total_amount || 0);
    byVillage[village].ownerCost += parseFloat(job.hours || 0) * parseFloat(job.machines?.owner_rate_per_hour || 0);
    byVillage[village].profit = byVillage[village].revenue - byVillage[village].ownerCost;
    byVillage[village].jobs++;
  });
  
  console.log('Jobs by Village:');
  Object.entries(byVillage).forEach(([village, data]) => {
    console.log(`\n${village}:`);
    console.log(`  Jobs: ${data.jobs}`);
    console.log(`  Revenue: ₹${data.revenue.toLocaleString('en-IN')}`);
    console.log(`  Owner Cost: ₹${data.ownerCost.toLocaleString('en-IN')}`);
    console.log(`  Profit: ₹${data.profit.toLocaleString('en-IN')}`);
  });
}

checkData().then(() => process.exit(0));
