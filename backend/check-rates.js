const supabase = require('./config/supabase');

async function checkRates() {
  const { data: jobs } = await supabase
    .from('harvesting_jobs')
    .select('id, hours, rate_per_hour, total_amount');
  
  console.log('\n=== CHECKING RATES ===');
  console.log('Total jobs:', jobs?.length);
  
  let totalHours = 0;
  let totalRevenue = 0;
  const ratesUsed = {};
  
  jobs?.forEach(job => {
    const hours = parseFloat(job.hours || 0);
    const rate = parseFloat(job.rate_per_hour || 0);
    const amount = parseFloat(job.total_amount || 0);
    
    totalHours += hours;
    totalRevenue += amount;
    
    if (!ratesUsed[rate]) ratesUsed[rate] = { count: 0, hours: 0, revenue: 0 };
    ratesUsed[rate].count++;
    ratesUsed[rate].hours += hours;
    ratesUsed[rate].revenue += amount;
  });
  
  console.log('\nTotal Hours:', totalHours.toFixed(2));
  console.log('Total Revenue:', '₹' + totalRevenue.toLocaleString());
  console.log('\nRates used:');
  Object.keys(ratesUsed).sort((a, b) => b - a).forEach(rate => {
    const data = ratesUsed[rate];
    console.log(`  ₹${rate}/hr: ${data.count} jobs, ${data.hours.toFixed(2)} hours, ₹${data.revenue.toLocaleString()} revenue`);
  });
  
  console.log('\nIf all were at ₹3000/hr:');
  console.log('  Expected: ₹' + (totalHours * 3000).toLocaleString());
  console.log('  Actual:   ₹' + totalRevenue.toLocaleString());
  console.log('  Difference: ₹' + ((totalHours * 3000) - totalRevenue).toLocaleString());
  
  process.exit(0);
}

checkRates();
