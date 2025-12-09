const supabase = require('./config/supabase');

(async () => {
  try {
    console.log('Testing discount_hours column...');
    
    // Check if column exists by trying to select it
    const { data, error } = await supabase
      .from('machines')
      .select('id, machine_number, discount_hours')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing discount_hours column:', error.message);
      console.log('This means the migration has NOT been run yet.');
      console.log('\n✅ Solution: Run the SQL in backend/add-discount-fields.sql in Supabase SQL Editor');
    } else {
      console.log('✅ discount_hours column exists!');
      console.log('Sample data:', data);
    }
    
    // Also check harvesting_jobs
    const { data: jobData, error: jobError } = await supabase
      .from('harvesting_jobs')
      .select('id, discount_amount_to_farmer')
      .limit(1);
    
    if (jobError) {
      console.log('\n❌ Error accessing discount_amount_to_farmer column:', jobError.message);
      console.log('This means the migration has NOT been run yet.');
    } else {
      console.log('✅ discount_amount_to_farmer column exists!');
      console.log('Sample job data:', jobData);
    }
    
  } catch (e) {
    console.log('Exception:', e.message);
  }
  
  process.exit(0);
})();
