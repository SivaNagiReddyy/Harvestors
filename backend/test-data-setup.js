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
          driver_phone: '9988776655'
        },
        {
          machine_owner_id: owners[1].id,
          machine_number: 'MH-1002',
          machine_type: 'Combine Harvester',
          rate_per_acre: 1500,
          driver_name: 'Venkat',
          driver_phone: '9988776656'
        },
        {
          machine_owner_id: owners[2].id,
          machine_number: 'MH-1003',
          machine_type: 'Tractor',
          rate_per_acre: 1400,
          driver_name: 'Ravi',
          driver_phone: '9988776657'
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
        { name: 'Narasimha Rao', phone: '9123456780', village: 'Munagala' },
        { name: 'Venkateswarlu', phone: '9123456781', village: 'Nalgonda' },
        { name: 'Govind Reddy', phone: '9123456782', village: 'Miryalaguda' },
        { name: 'Satish Kumar', phone: '9123456783', village: 'Munagala' },
        { name: 'Madhav Reddy', phone: '9123456784', village: 'Nalgonda' }
      ])
      .select();

    if (farmersError) throw farmersError;
    console.log(`✅ Inserted ${farmers.length} farmers`);

    // 4. Insert Harvesting Jobs
    console.log('\n📝 Inserting Harvesting Jobs...');
    const jobs = [
      {
        farmer_id: farmers[0].id,
        machine_id: machines[0].id,
        field_location: 'Survey No. 123, Munagala',
        crop_type: 'Paddy',
        acres: 5.5,
        rate_per_acre: 1200,
        start_date: '2024-11-15',
        end_date: '2024-11-16',
        status: 'Completed',
        payment_to_owner: 5500,
        expenses_given: 1000,
        amount_charged_to_farmer: 6600,
        amount_paid_by_farmer: 6600,
        payment_status: 'Paid'
      },
      {
        farmer_id: farmers[1].id,
        machine_id: machines[1].id,
        field_location: 'Survey No. 456, Nalgonda',
        crop_type: 'Maize',
        acres: 8.0,
        rate_per_acre: 1500,
        start_date: '2024-11-17',
        end_date: '2024-11-18',
        status: 'Completed',
        payment_to_owner: 9600,
        expenses_given: 1500,
        amount_charged_to_farmer: 12000,
        amount_paid_by_farmer: 5000,
        payment_status: 'Partial'
      },
      {
        farmer_id: farmers[2].id,
        machine_id: machines[2].id,
        field_location: 'Survey No. 789, Miryalaguda',
        crop_type: 'Paddy',
        acres: 10.0,
        rate_per_acre: 1300,
        start_date: '2024-11-20',
        end_date: '2024-11-21',
        status: 'In Progress',
        payment_to_owner: 0,
        expenses_given: 0,
        amount_charged_to_farmer: 13000,
        amount_paid_by_farmer: 0,
        payment_status: 'Pending'
      },
      {
        farmer_id: farmers[3].id,
        machine_id: machines[0].id,
        field_location: 'Survey No. 234, Munagala',
        crop_type: 'Cotton',
        acres: 6.5,
        rate_per_acre: 1400,
        start_date: '2024-11-22',
        end_date: '2024-11-23',
        status: 'Completed',
        payment_to_owner: 6500,
        expenses_given: 800,
        amount_charged_to_farmer: 9100,
        amount_paid_by_farmer: 9100,
        payment_status: 'Paid'
      },
      {
        farmer_id: farmers[4].id,
        machine_id: machines[1].id,
        field_location: 'Survey No. 567, Nalgonda',
        crop_type: 'Paddy',
        acres: 7.5,
        rate_per_acre: 1250,
        start_date: '2024-11-19',
        end_date: '2024-11-20',
        status: 'Completed',
        payment_to_owner: 7500,
        expenses_given: 1200,
        amount_charged_to_farmer: 9375,
        amount_paid_by_farmer: 4000,
        payment_status: 'Partial'
      }
    ];

    const { data: insertedJobs, error: jobsError } = await supabase
      .from('harvesting_jobs')
      .insert(jobs)
      .select();

    if (jobsError) throw jobsError;
    console.log(`✅ Inserted ${insertedJobs.length} harvesting jobs`);

    // 5. Insert Dealers
    console.log('\n📝 Inserting Dealers...');
    const { data: dealers, error: dealersError } = await supabase
      .from('dealers')
      .insert([
        { name: 'Srinivas Dealers', contact_person: 'Srinivas', phone: '9876501234', village: 'Hyderabad' },
        { name: 'Lakshmi Agri Services', contact_person: 'Lakshmi', phone: '9876501235', village: 'Warangal' },
        { name: 'Rama Equipment Rentals', contact_person: 'Rama Krishna', phone: '9876501236', village: 'Khammam' }
      ])
      .select();

    if (dealersError) throw dealersError;
    console.log(`✅ Inserted ${dealers.length} dealers`);

    // 6. Insert Machine Rentals
    console.log('\n📝 Inserting Machine Rentals...');
    const rentals = [
      {
        dealer_id: dealers[0].id,
        machine_id: machines[0].id,
        start_date: '2024-11-10',
        end_date: '2024-11-12',
        total_days: 3,
        rate_per_day: 3000,
        total_amount: 9000,
        commission_percentage: 10,
        commission_amount: 900,
        owner_amount: 8100,
        status: 'Completed'
      },
      {
        dealer_id: dealers[1].id,
        machine_id: machines[1].id,
        start_date: '2024-11-13',
        end_date: '2024-11-15',
        total_days: 3,
        rate_per_day: 3500,
        total_amount: 10500,
        commission_percentage: 12,
        commission_amount: 1260,
        owner_amount: 9240,
        status: 'Completed'
      },
      {
        dealer_id: dealers[2].id,
        machine_id: machines[2].id,
        start_date: '2024-11-18',
        end_date: '2024-11-20',
        total_days: 3,
        rate_per_day: 2500,
        total_amount: 7500,
        commission_percentage: 15,
        commission_amount: 1125,
        owner_amount: 6375,
        status: 'Active'
      },
      {
        dealer_id: dealers[0].id,
        machine_id: machines[0].id,
        start_date: '2024-11-21',
        end_date: '2024-11-23',
        total_days: 3,
        rate_per_day: 3200,
        total_amount: 9600,
        commission_percentage: 10,
        commission_amount: 960,
        owner_amount: 8640,
        status: 'Active'
      }
    ];

    const { data: insertedRentals, error: rentalsError } = await supabase
      .from('machine_rentals')
      .insert(rentals)
      .select();

    if (rentalsError) throw rentalsError;
    console.log(`✅ Inserted ${insertedRentals.length} machine rentals`);

    // 7. Insert Rental Payments
    console.log('\n📝 Inserting Rental Payments...');
    const rentalPayments = [
      {
        rental_id: insertedRentals[0].id,
        amount_paid: 9000,
        payment_date: '2024-11-12',
        payment_method: 'UPI',
        notes: 'Full payment received'
      },
      {
        rental_id: insertedRentals[1].id,
        amount_paid: 5000,
        payment_date: '2024-11-15',
        payment_method: 'Cash',
        notes: 'Partial payment - Balance pending'
      },
      {
        rental_id: insertedRentals[2].id,
        amount_paid: 0,
        payment_date: null,
        payment_method: 'Cash',
        notes: 'Payment pending - Active rental'
      },
      {
        rental_id: insertedRentals[3].id,
        amount_paid: 0,
        payment_date: null,
        payment_method: 'UPI',
        notes: 'Payment pending - Active rental'
      }
    ];

    const { data: insertedPayments, error: paymentsError } = await supabase
      .from('rental_payments')
      .insert(rentalPayments)
      .select();

    if (paymentsError) throw paymentsError;
    console.log(`✅ Inserted ${insertedPayments.length} rental payments`);

    console.log('\n✨ Sample data insertion completed successfully!\n');
    
    // Print summary
    console.log('📊 Data Summary:');
    console.log('================');
    console.log(`Machine Owners: ${owners.length}`);
    console.log(`Machines: ${machines.length}`);
    console.log(`Farmers: ${farmers.length}`);
    console.log(`Harvesting Jobs: ${insertedJobs.length}`);
    console.log(`Dealers: ${dealers.length}`);
    console.log(`Machine Rentals: ${insertedRentals.length}`);
    console.log(`Rental Payments: ${insertedPayments.length}`);

  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
insertSampleData()
  .then(() => {
    console.log('\n✅ All done! You can now test the application.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
