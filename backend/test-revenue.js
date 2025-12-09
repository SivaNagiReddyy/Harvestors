require('dotenv').config();
const supabase = require('./config/supabase');

async function testRevenue() {
  console.log('\n=== TESTING REVENUE CALCULATION ===\n');

  // Get all jobs
  const { data: jobs, error } = await supabase
    .from('harvesting_jobs')
    .select('hours, rate_per_hour');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Total jobs: ${jobs.length}\n`);

  let totalHours = 0;
  let calculatedRevenue = 0;

  jobs.forEach(job => {
    const hours = parseFloat(job.hours || 0);
    const rate = parseFloat(job.rate_per_hour || 0);
    const amount = hours * rate;
    
    totalHours += hours;
    calculatedRevenue += amount;
  });

  console.log(`Total Hours: ${totalHours.toFixed(2)}`);
  console.log(`Calculated Revenue: ₹${calculatedRevenue.toFixed(2)}`);
  console.log(`Expected (205.01 × 3000): ₹615,030.00`);
  console.log(`\nMatch: ${calculatedRevenue.toFixed(2) === '615030.00' ? '✅ YES' : '❌ NO'}\n`);

  process.exit(0);
}

testRevenue();
