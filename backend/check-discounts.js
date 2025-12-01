const supabase = require('./config/supabase');

async function checkDiscounts() {
  // Get all jobs with discounts
  const { data: jobs, error } = await supabase
    .from('harvesting_jobs')
    .select(`
      id,
      farmer_id,
      machine_id,
      total_amount,
      hours,
      rate_per_hour,
      discount_from_owner,
      discount_to_farmer,
      net_amount_to_owner,
      net_amount_from_farmer,
      machines!inner(id, machine_owner_id, owner_rate_per_hour)
    `)
    .or('discount_from_owner.gt.0,discount_to_farmer.gt.0');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('\n=== JOBS WITH DISCOUNTS ===\n');
  jobs?.forEach(job => {
    const grossOwner = parseFloat(job.hours || 0) * parseFloat(job.machines?.owner_rate_per_hour || 0);
    const grossFarmer = parseFloat(job.total_amount || 0);
    
    console.log(`Job ID: ${job.id}`);
    console.log(`  Farmer Total (Gross): ₹${grossFarmer}`);
    console.log(`  Discount to Farmer: ₹${job.discount_to_farmer || 0}`);
    console.log(`  Net from Farmer: ₹${job.net_amount_from_farmer || 0} (should be ${grossFarmer - (job.discount_to_farmer || 0)})`);
    console.log(`  Owner Amount (Gross): ₹${grossOwner}`);
    console.log(`  Discount from Owner: ₹${job.discount_from_owner || 0}`);
    console.log(`  Net to Owner: ₹${job.net_amount_to_owner || 0} (should be ${grossOwner - (job.discount_from_owner || 0)})`);
    console.log('---');
  });
  
  // Calculate totals
  let totalDiscountFromOwner = 0;
  let totalDiscountToFarmer = 0;
  let totalGrossToOwners = 0;
  let totalNetToOwners = 0;
  let totalGrossFromFarmers = 0;
  let totalNetFromFarmers = 0;
  
  jobs?.forEach(job => {
    const grossOwner = parseFloat(job.hours || 0) * parseFloat(job.machines?.owner_rate_per_hour || 0);
    const grossFarmer = parseFloat(job.total_amount || 0);
    
    totalDiscountFromOwner += parseFloat(job.discount_from_owner || 0);
    totalDiscountToFarmer += parseFloat(job.discount_to_farmer || 0);
    totalGrossToOwners += grossOwner;
    totalNetToOwners += parseFloat(job.net_amount_to_owner || 0);
    totalGrossFromFarmers += grossFarmer;
    totalNetFromFarmers += parseFloat(job.net_amount_from_farmer || 0);
  });
  
  console.log('\n=== TOTALS ===');
  console.log(`Total Discounts from Owners: ₹${totalDiscountFromOwner}`);
  console.log(`Total Discounts to Farmers: ₹${totalDiscountToFarmer}`);
  console.log(`Gross Amount to Owners: ₹${totalGrossToOwners}`);
  console.log(`Net Amount to Owners: ₹${totalNetToOwners} (difference: ₹${totalGrossToOwners - totalNetToOwners})`);
  console.log(`Gross Amount from Farmers: ₹${totalGrossFromFarmers}`);
  console.log(`Net Amount from Farmers: ₹${totalNetFromFarmers} (difference: ₹${totalGrossFromFarmers - totalNetFromFarmers})`);
  
  process.exit(0);
}

checkDiscounts();
