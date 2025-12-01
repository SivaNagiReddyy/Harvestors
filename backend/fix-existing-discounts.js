const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function fixExistingDiscounts() {
  try {
    console.log('🔧 Fetching all jobs with discounts...');
    
    // Get all jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('harvesting_jobs')
      .select('*')
      .or('discount_from_owner.gt.0,discount_to_farmer.gt.0');

    if (jobsError) throw jobsError;

    console.log(`📊 Found ${jobs.length} jobs with discounts`);

    for (const job of jobs) {
      console.log(`\n🔍 Processing Job ID: ${job.id}`);
      console.log(`   Hours: ${job.hours}, Rate: ${job.rate_per_hour}, Total: ${job.total_amount}`);
      console.log(`   Discount from owner: ${job.discount_from_owner}, Discount to farmer: ${job.discount_to_farmer}`);
      
      // Get machine data to find owner's rate
      const { data: machine } = await supabase
        .from('machines')
        .select('owner_rate_per_hour')
        .eq('id', job.machine_id)
        .single();

      const jobHours = parseFloat(job.hours || 0);
      const ownerRate = parseFloat(machine?.owner_rate_per_hour || 0); // Owner's hourly rate
      const farmerRate = parseFloat(job.rate_per_hour || 0);     // Farmer's hourly rate

      // Calculate gross amounts
      const grossOwnerAmount = jobHours * ownerRate;   // What we pay to owner
      const grossFarmerAmount = jobHours * farmerRate;  // What farmer pays us
      
      console.log(`   📊 Gross calculations: Owner: ${jobHours} × ${ownerRate} = ${grossOwnerAmount}, Farmer: ${jobHours} × ${farmerRate} = ${grossFarmerAmount}`);

      // Calculate net amounts
      const ownerDiscount = parseFloat(job.discount_from_owner) || 0;
      const farmerDiscount = parseFloat(job.discount_to_farmer) || 0;
      
      const netOwnerAmount = grossOwnerAmount - ownerDiscount;
      const netFarmerAmount = grossFarmerAmount - farmerDiscount;

      console.log(`   📊 Calculated net_amount_to_owner: ${netOwnerAmount}`);
      console.log(`   📊 Calculated net_amount_from_farmer: ${netFarmerAmount}`);

      // Calculate differences from old values
      const oldNetOwner = parseFloat(job.net_amount_to_owner || 0);
      const oldNetFarmer = parseFloat(job.net_amount_from_farmer || 0);
      
      const ownerDifference = netOwnerAmount - oldNetOwner;
      const farmerDifference = netFarmerAmount - oldNetFarmer;

      console.log(`   🔄 Owner difference: ${ownerDifference}, Farmer difference: ${farmerDifference}`);

      // Update the job with correct net amounts
      const { error: updateError } = await supabase
        .from('harvesting_jobs')
        .update({
          net_amount_to_owner: netOwnerAmount,
          net_amount_from_farmer: netFarmerAmount
        })
        .eq('id', job.id);

      if (updateError) {
        console.error(`   ❌ Error updating job ${job.id}:`, updateError);
        continue;
      }

      console.log(`   ✅ Updated job ${job.id}`);

      // Update machine pending if owner difference
      if (ownerDifference !== 0 && job.machine_id) {
        const { data: machine } = await supabase
          .from('machines')
          .select('total_amount_pending')
          .eq('id', job.machine_id)
          .single();

        if (machine) {
          const newPending = (parseFloat(machine.total_amount_pending) || 0) + ownerDifference;
          
          await supabase
            .from('machines')
            .update({ total_amount_pending: newPending })
            .eq('id', job.machine_id);
          
          console.log(`   ✅ Updated machine pending: ${machine.total_amount_pending} → ${newPending}`);
        }
      }

      // Update farmer pending if farmer difference
      if (farmerDifference !== 0 && job.farmer_id) {
        const { data: farmer } = await supabase
          .from('farmers')
          .select('total_amount_pending')
          .eq('id', job.farmer_id)
          .single();

        if (farmer) {
          const newPending = (parseFloat(farmer.total_amount_pending) || 0) + farmerDifference;
          
          await supabase
            .from('farmers')
            .update({ total_amount_pending: newPending })
            .eq('id', job.farmer_id);
          
          console.log(`   ✅ Updated farmer pending: ${farmer.total_amount_pending} → ${newPending}`);
        }
      }
    }

    console.log('\n✅ All discounts fixed successfully!');
    console.log('🔄 Please refresh your dashboard to see the updated values.');
    
  } catch (error) {
    console.error('❌ Error fixing discounts:', error);
  }
}

fixExistingDiscounts();
