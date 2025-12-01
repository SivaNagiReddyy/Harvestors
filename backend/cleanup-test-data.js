require('dotenv').config();
const supabase = require('./config/supabase');

async function cleanupTestData() {
  console.log('🧹 Starting cleanup of test data...\n');

  try {
    // Delete in reverse order of dependencies
    
    console.log('Deleting rental payments...');
    const { error: paymentsError } = await supabase
      .from('rental_payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (paymentsError) console.log('Note:', paymentsError.message);

    console.log('Deleting machine rentals...');
    const { error: rentalsError } = await supabase
      .from('machine_rentals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (rentalsError) console.log('Note:', rentalsError.message);

    console.log('Deleting dealers...');
    const { error: dealersError } = await supabase
      .from('dealers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (dealersError) console.log('Note:', dealersError.message);

    console.log('Deleting payments...');
    const { error: jobPaymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (jobPaymentsError) console.log('Note:', jobPaymentsError.message);

    console.log('Deleting harvesting jobs...');
    const { error: jobsError } = await supabase
      .from('harvesting_jobs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (jobsError) console.log('Note:', jobsError.message);

    console.log('Deleting farmers...');
    const { error: farmersError } = await supabase
      .from('farmers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (farmersError) console.log('Note:', farmersError.message);

    console.log('Deleting machines...');
    const { error: machinesError } = await supabase
      .from('machines')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (machinesError) console.log('Note:', machinesError.message);

    console.log('Deleting machine owners...');
    const { error: ownersError } = await supabase
      .from('machine_owners')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (ownersError) console.log('Note:', ownersError.message);

    console.log('\n✅ Cleanup complete! Database is now ready for fresh test data.\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupTestData()
  .then(() => {
    console.log('🎉 Cleanup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
