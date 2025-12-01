const supabase = require('./config/supabase');

async function testDashboardCalculation() {
  console.log('\n=== TESTING DASHBOARD CALCULATION ===\n');

  // Fetch jobs with machines
  const { data: allJobs, error: jobsError } = await supabase
    .from('harvesting_jobs')
    .select(`
      machine_id,
      total_amount,
      hours,
      rate_per_hour,
      machines!inner(id, machine_owner_id, rate_per_acre)
    `);

  if (jobsError) {
    console.error('❌ Error fetching jobs:', jobsError);
    process.exit(1);
  }

  console.log('📊 Total jobs found:', allJobs?.length);
  console.log('\n📋 First job details:');
  if (allJobs && allJobs.length > 0) {
    console.log(JSON.stringify(allJobs[0], null, 2));
  }

  // Calculate owner earnings
  const ownerEarnings = {};
  let totalOwnerCost = 0;
  
  allJobs?.forEach((job, index) => {
    const ownerId = job.machines?.machine_owner_id;
    const hours = parseFloat(job.hours || 0);
    const ownerRate = parseFloat(job.machines?.rate_per_acre || 0);
    const amount = hours * ownerRate;
    
    console.log(`\n🔍 Job ${index + 1}:`);
    console.log(`   Machine ID: ${job.machine_id}`);
    console.log(`   Owner ID: ${ownerId}`);
    console.log(`   Hours: ${hours}`);
    console.log(`   Owner Rate (rate_per_acre): ₹${ownerRate}`);
    console.log(`   Farmer Rate (rate_per_hour): ₹${job.rate_per_hour}`);
    console.log(`   💰 Owner Amount: ₹${amount}`);
    console.log(`   💰 Farmer Amount: ₹${hours * job.rate_per_hour}`);
    
    if (ownerId && amount > 0) {
      ownerEarnings[ownerId] = (ownerEarnings[ownerId] || 0) + amount;
      totalOwnerCost += amount;
    }
    
    if (hours > 0 && ownerRate === 0) {
      console.log('   ⚠️  WARNING: Machine has no rate_per_acre set!');
    }
  });

  console.log('\n\n📈 SUMMARY:');
  console.log('─────────────────────────────────────');
  console.log('Total Owner Earnings by Owner ID:', ownerEarnings);
  console.log('Total To Pay to Owners: ₹' + totalOwnerCost);
  console.log('─────────────────────────────────────\n');

  process.exit(0);
}

testDashboardCalculation();
