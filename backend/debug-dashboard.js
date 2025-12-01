require('dotenv').config();
const supabase = require('./config/supabase');

async function debugDashboard() {
  console.log('\n=== DEBUGGING DASHBOARD CALCULATION ===\n');

  // Get all jobs with machine data
  const { data: allJobs, error: jobsError } = await supabase
    .from('harvesting_jobs')
    .select(`
      id,
      machine_id,
      total_amount,
      hours,
      rate_per_hour,
      machines!inner(id, machine_owner_id, rate_per_acre, machine_number, machine_type)
    `);

  if (jobsError) {
    console.error('Error fetching jobs:', jobsError);
    return;
  }

  console.log(`\n📊 Found ${allJobs?.length || 0} jobs\n`);

  // Calculate total earned by owners
  const ownerEarnings = {};
  let totalOwnerEarnings = 0;

  allJobs?.forEach((job, index) => {
    const ownerId = job.machines?.machine_owner_id;
    const hours = parseFloat(job.hours || 0);
    const ownerRate = parseFloat(job.machines?.rate_per_acre || 0);
    const farmerRate = parseFloat(job.rate_per_hour || 0);
    const amount = hours * ownerRate;
    const farmerAmount = hours * farmerRate;
    
    console.log(`Job ${index + 1}:`, {
      jobId: job.id,
      machineType: job.machines?.machine_type,
      machineNumber: job.machines?.machine_number,
      ownerId,
      hours,
      ownerRate: `₹${ownerRate}/hour`,
      farmerRate: `₹${farmerRate}/hour`,
      ownerAmount: `₹${amount}`,
      farmerAmount: `₹${farmerAmount}`,
      profit: `₹${farmerAmount - amount}`
    });
    
    if (ownerId && amount > 0) {
      ownerEarnings[ownerId] = (ownerEarnings[ownerId] || 0) + amount;
      totalOwnerEarnings += amount;
    } else if (hours > 0) {
      console.warn('⚠️  WARNING: Job has hours but zero owner earnings!');
    }
  });

  console.log('\n=== OWNER EARNINGS SUMMARY ===');
  Object.entries(ownerEarnings).forEach(([ownerId, earnings]) => {
    console.log(`Owner ${ownerId}: ₹${earnings.toLocaleString()}`);
  });

  console.log('\n=== TOTALS ===');
  console.log(`Total to Pay to Owners: ₹${totalOwnerEarnings.toLocaleString()}`);

  // Calculate total revenue from farmers
  const totalRevenue = allJobs?.reduce((sum, job) => {
    const amount = parseFloat(job.total_amount) || (parseFloat(job.hours || 0) * parseFloat(job.rate_per_hour || 0));
    return sum + amount;
  }, 0) || 0;

  console.log(`Total Revenue from Farmers: ₹${totalRevenue.toLocaleString()}`);
  console.log(`Your Profit: ₹${(totalRevenue - totalOwnerEarnings).toLocaleString()}`);

  console.log('\n=== WHAT DASHBOARD SHOULD SHOW ===');
  console.log(`"To Pay to Owners" card: ₹${totalOwnerEarnings.toLocaleString()}`);
  console.log(`"Revenue" card: ₹${totalRevenue.toLocaleString()}`);
  console.log(`"Net Profit" card: ₹${(totalRevenue - totalOwnerEarnings).toLocaleString()}`);

  process.exit(0);
}

debugDashboard().catch(console.error);
