require('dotenv').config();
const supabase = require('./config/supabase');

async function checkRentals() {
  console.log('\n=== CHECKING RENTAL DATA ===\n');

  const { data: rentals, error } = await supabase
    .from('machine_rentals')
    .select('*, dealer:dealers(name), machine:machines(machine_number, machine_type)');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Total Rentals: ${rentals?.length || 0}\n`);

  if (rentals && rentals.length > 0) {
    rentals.forEach((rental, i) => {
      console.log(`Rental ${i + 1}:`, {
        machine: `${rental.machine?.machine_type} - ${rental.machine?.machine_number}`,
        dealer: rental.dealer?.name,
        days: rental.days_rented,
        totalCostToOwner: `₹${rental.total_cost_to_owner || 0}`,
        totalCharged: `₹${rental.total_amount_charged || 0}`,
        profit: `₹${rental.profit_margin || 0}`,
        status: rental.status
      });
    });
  } else {
    console.log('⚠️  No rental data found!');
    console.log('Machine TN89SA2023 needs rental data to be created.');
  }

  process.exit(0);
}

checkRentals().catch(console.error);
