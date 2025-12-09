const supabase = require('./config/supabase');

async function checkMachines() {
  const { data: machines, error } = await supabase
    .from('machines')
    .select('id, machine_number, owner_rate_per_hour, rate_per_hour, machine_owners(name)');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('\n=== MACHINES ===');
  machines?.forEach(machine => {
    console.log(`Machine ${machine.machine_number} (ID: ${machine.id}):`);
    console.log(`  Owner: ${machine.machine_owners?.name}`);
    console.log(`  Owner Rate: ₹${machine.owner_rate_per_hour}/hr`);
    console.log(`  Farmer Rate: ₹${machine.rate_per_hour}/hr`);
    console.log(`  Profit Margin: ₹${machine.rate_per_hour - machine.owner_rate_per_hour}/hr`);
    console.log('');
  });
  
  process.exit(0);
}

checkMachines();
