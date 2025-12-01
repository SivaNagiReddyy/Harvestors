require('dotenv').config();
const supabase = require('./config/supabase');

async function insertSampleData() {
  console.log('🚀 Starting sample data insertion...\n');

  try {
    // 1. Insert Machine Owners
    console.log('📝 Inserting Machine Owners...');
    const { data: owners, error: ownersError } = await supabase
      .from('machine_owners')
      .insert([
        {
          name: 'Rajesh Kumar',
          phone: '9876543210',
          email: 'rajesh@example.com',
          address: 'Munagala, Nalgonda District'
        },
        {
          name: 'Suresh Reddy',
          phone: '9876543211',
          email: 'suresh@example.com',
          address: 'Nalgonda, Nalgonda District'
        },
        {
          name: 'Ramesh Naidu',
          phone: '9876543212',
          email: 'ramesh@example.com',
          address: 'Miryalaguda, Nalgonda District'
        }
      ])
      .select();

    if (ownersError) throw ownersError;
    console.log(`✅ Inserted ${owners.length} machine owners`);

    // 2. Insert Machines
    console.log('\n📝 Inserting Machines...');
    const { data: machines, error: machinesError } = await supabase
      .from('machines')
      .insert([
        {
          machine_owner_id: owners[0].id,
          machine_number: 'MH-1001',
          machine_type: 'Combine Harvester',
          rate_per_acre: 1200,
          driver_name: 'Krishna',
          driver_phone: '9988776655',
          status: 'Active'
        },
        {
          machine_owner_id: owners[1].id,
          machine_number: 'MH-1002',
          machine_type: 'Combine Harvester',
          rate_per_acre: 1500,
          driver_name: 'Venkat',
          driver_phone: '9988776656',
          status: 'Active'
        },
        {
          machine_owner_id: owners[2].id,
          machine_number: 'MH-1003',
          machine_type: 'Tractor',
          rate_per_acre: 1400,
          driver_name: 'Ravi',
          driver_phone: '9988776657',
          status: 'Active'
        }
      ])
      .select();

    if (machinesError) throw machinesError;
    console.log(`✅ Inserted ${machines.length} machines`);

    // 3. Insert Farmers
    console.log('\n📝 Inserting Farmers...');
    const { data: farmers, error: farmersError } = await supabase
      .from('farmers')
      .insert([
        {
          name: 'Venkatesh',
          phone: '9123456780',
          village: 'Munagala',
          address: 'Munagala Village, Nalgonda'
        },
        {
          name: 'Lakshmi',
          phone: '9123456781',
          village: 'Nalgonda',
          address: 'Nalgonda Town'
        },
        {
          name: 'Narayana',
          phone: '9123456782',
          village: 'Miryalaguda',
          address: 'Miryalaguda Town'
        },
        {
          name: 'Srinivas',
          phone: '9123456783',
          village: 'Kodad',
          address: 'Kodad Village'
        },
        {
          name: 'Anjali',
          phone: '9123456784',
          village: 'Suryapet',
          address: 'Suryapet Town'
        }
      ])
      .select();

    if (farmersError) throw farmersError;
    console.log(`✅ Inserted ${farmers.length} farmers`);

    // 4. Insert Harvesting Jobs (using hours-based system)
    console.log('\n📝 Inserting Harvesting Jobs...');
    const { data: jobs, error: jobsError} = await supabase
      .from('harvesting_jobs')
      .insert([
        {
          farmer_id: farmers[0].id,
          machine_id: machines[0].id,
          scheduled_date: '2025-01-15',
          hours: 5.5,
          rate_per_hour: 1200,
          advance_from_farmer: 6600,
          expenses_given: 1000,
          acres: 5.5,
          rate_per_acre: 0,
          status: 'Completed',
          notes: 'Paddy harvesting - Paid in full'
        },
        {
          farmer_id: farmers[1].id,
          machine_id: machines[1].id,
          scheduled_date: '2025-01-16',
          hours: 8.0,
          rate_per_hour: 1500,
          advance_from_farmer: 5000,
          expenses_given: 1200,
          acres: 8.0,
          rate_per_acre: 0,
          status: 'Completed',
          notes: 'Maize harvesting - Partial payment'
        },
        {
          farmer_id: farmers[2].id,
          machine_id: machines[0].id,
          scheduled_date: '2025-01-20',
          hours: 10.0,
          rate_per_hour: 1200,
          advance_from_farmer: 0,
          expenses_given: 800,
          acres: 10.0,
          rate_per_acre: 0,
          status: 'In Progress',
          notes: 'Paddy harvesting - In progress'
        },
        {
          farmer_id: farmers[3].id,
          machine_id: machines[2].id,
          scheduled_date: '2025-01-12',
          hours: 6.5,
          rate_per_hour: 1400,
          advance_from_farmer: 9100,
          expenses_given: 1500,
          acres: 6.5,
          rate_per_acre: 0,
          status: 'Completed',
          notes: 'Cotton harvesting - Paid in full'
        },
        {
          farmer_id: farmers[4].id,
          machine_id: machines[1].id,
          scheduled_date: '2025-01-14',
          hours: 7.5,
          rate_per_hour: 1250,
          advance_from_farmer: 4000,
          expenses_given: 900,
          acres: 7.5,
          rate_per_acre: 0,
          status: 'Completed',
          notes: 'Paddy harvesting - Partial payment'
        }
      ])
      .select();

    if (jobsError) throw jobsError;
    console.log(`✅ Inserted ${jobs.length} harvesting jobs`);

    // 5. Insert Dealers
    console.log('\n📝 Inserting Dealers...');
    const { data: dealers, error: dealersError } = await supabase
      .from('dealers')
      .insert([
        {
          name: 'Srinivas Enterprises',
          phone: '9876540001',
          email: 'srinivas.ent@example.com',
          address: 'Hyderabad',
          business_name: 'Srinivas Enterprises',
          status: 'Active'
        },
        {
          name: 'Lakshmi Trading',
          phone: '9876540002',
          email: 'lakshmi.trading@example.com',
          address: 'Warangal',
          business_name: 'Lakshmi Trading Co.',
          status: 'Active'
        },
        {
          name: 'Rama Krishna Agencies',
          phone: '9876540003',
          email: 'ramakrishna@example.com',
          address: 'Vijayawada',
          business_name: 'Rama Krishna Agencies',
          status: 'Active'
        }
      ])
      .select();

    if (dealersError) throw dealersError;
    console.log(`✅ Inserted ${dealers.length} dealers`);

    // 6. Insert Machine Rentals
    console.log('\n📝 Inserting Machine Rentals...');
    const { data: rentals, error: rentalsError } = await supabase
      .from('machine_rentals')
      .insert([
        {
          dealer_id: dealers[0].id,
          machine_id: machines[0].id,
          season_name: 'Kharif 2025',
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          hourly_rate_to_dealer: 1500,
          hourly_cost_from_owner: 1350,
          total_hours_used: 10,
          total_amount_charged: 15000,
          total_cost_to_owner: 13500,
          profit_margin: 1500,
          advance_paid: 15000,
          status: 'Completed'
        },
        {
          dealer_id: dealers[1].id,
          machine_id: machines[1].id,
          season_name: 'Kharif 2025',
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          hourly_rate_to_dealer: 1800,
          hourly_cost_from_owner: 1584,
          total_hours_used: 10,
          total_amount_charged: 18000,
          total_cost_to_owner: 15840,
          profit_margin: 2160,
          advance_paid: 10000,
          status: 'Active'
        },
        {
          dealer_id: dealers[2].id,
          machine_id: machines[2].id,
          season_name: 'Rabi 2025',
          start_date: '2025-02-01',
          end_date: '2025-04-30',
          hourly_rate_to_dealer: 2000,
          hourly_cost_from_owner: 1700,
          total_hours_used: 10,
          total_amount_charged: 20000,
          total_cost_to_owner: 17000,
          profit_margin: 3000,
          advance_paid: 20000,
          status: 'Active'
        },
        {
          dealer_id: dealers[0].id,
          machine_id: machines[0].id,
          season_name: 'Rabi 2024',
          start_date: '2024-11-01',
          end_date: '2024-12-31',
          hourly_rate_to_dealer: 1500,
          hourly_cost_from_owner: 1350,
          total_hours_used: 7,
          total_amount_charged: 10500,
          total_cost_to_owner: 9450,
          profit_margin: 1050,
          advance_paid: 5000,
          status: 'Completed'
        }
      ])
      .select();

    if (rentalsError) throw rentalsError;
    console.log(`✅ Inserted ${rentals.length} machine rentals`);

    // 7. Insert Rental Payments
    console.log('\n📝 Inserting Rental Payments...');
    const { data: payments, error: paymentsError } = await supabase
      .from('rental_payments')
      .insert([
        {
          rental_id: rentals[0].id,
          dealer_id: dealers[0].id,
          amount: 15000,
          payment_date: '2025-01-05',
          payment_method: 'Bank Transfer',
          status: 'Completed',
          notes: 'Full payment received'
        },
        {
          rental_id: rentals[1].id,
          dealer_id: dealers[1].id,
          amount: 10000,
          payment_date: '2025-01-10',
          payment_method: 'UPI',
          status: 'Pending',
          notes: 'Advance payment - Balance pending'
        },
        {
          rental_id: rentals[2].id,
          dealer_id: dealers[2].id,
          amount: 20000,
          payment_date: '2025-02-05',
          payment_method: 'Cash',
          status: 'Completed',
          notes: 'Full payment received'
        },
        {
          rental_id: rentals[3].id,
          dealer_id: dealers[0].id,
          amount: 5000,
          payment_date: '2024-11-15',
          payment_method: 'Cheque',
          status: 'Pending',
          notes: 'Partial payment'
        }
      ])
      .select();

    if (paymentsError) throw paymentsError;
    console.log(`✅ Inserted ${payments.length} rental payments`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ SAMPLE DATA INSERTION COMPLETE ✨');
    console.log('='.repeat(60));
    console.log(`Machine Owners: ${owners.length}`);
    console.log(`Machines: ${machines.length}`);
    console.log(`Farmers: ${farmers.length}`);
    console.log(`Harvesting Jobs: ${jobs.length}`);
    console.log(`Dealers: ${dealers.length}`);
    console.log(`Machine Rentals: ${rentals.length}`);
    console.log(`Rental Payments: ${payments.length}`);
    console.log('='.repeat(60));
    
    console.log('\n💡 Quick Stats:');
    const harvestingRevenue = jobs.reduce((sum, j) => sum + (j.hours * j.rate_per_hour), 0);
    console.log(`Total Harvesting Revenue: ₹${harvestingRevenue}`);
    console.log(`Total Dealer Revenue: ₹${rentals.reduce((sum, r) => sum + r.total_amount_charged, 0)}`);
    console.log(`Total Profit from Rentals: ₹${rentals.reduce((sum, r) => sum + r.profit_margin, 0)}`);
    console.log('\n✅ You can now view your dashboard to see the data!');

  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message, error);
    process.exit(1);
  }
}

// Run the insertion
insertSampleData()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
