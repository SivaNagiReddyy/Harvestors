require('dotenv').config();
const supabase = require('./config/supabase');

async function checkMachineData() {
  console.log('\n=== CHECKING MACHINE DATA ===\n');

  // Get machines
  const { data: machines, error: machinesError } = await supabase
    .from('machines')
    .select('*');

  if (machinesError) {
    console.error('Error fetching machines:', machinesError);
    return;
  }

  console.log(`📋 Total Machines: ${machines?.length || 0}\n`);

  if (machines && machines.length > 0) {
    machines.forEach((machine, index) => {
      console.log(`Machine ${index + 1}:`, {
        id: machine.id,
        type: machine.machine_type,
        number: machine.machine_number,
        owner_rate: machine.rate_per_acre
      });
    });
  }

  // Get jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('harvesting_jobs')
    .select('*');

  console.log(`\n📋 Total Jobs: ${jobs?.length || 0}\n`);

  if (jobs && jobs.length > 0) {
    jobs.forEach((job, index) => {
      console.log(`Job ${index + 1}:`, {
        id: job.id,
        machine_id: job.machine_id,
        hours: job.hours,
        rate_per_hour: job.rate_per_hour
      });
    });
  }

  // Get expenses
  const { data: expenses, error: expensesError } = await supabase
    .from('daily_expenses')
    .select('*');

  console.log(`\n📋 Total Expenses: ${expenses?.length || 0}\n`);

  if (expenses && expenses.length > 0) {
    expenses.forEach((expense, index) => {
      console.log(`Expense ${index + 1}:`, {
        machine_id: expense.machine_id,
        amount: expense.amount
      });
    });
  }

  // Get payments
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('type', 'To Machine Owner');

  console.log(`\n📋 Total Payments to Owners: ${payments?.length || 0}\n`);

  if (payments && payments.length > 0) {
    payments.forEach((payment, index) => {
      console.log(`Payment ${index + 1}:`, {
        machine_id: payment.machine_id,
        amount: payment.amount
      });
    });
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Machines: ${machines?.length || 0}`);
  console.log(`Jobs: ${jobs?.length || 0}`);
  console.log(`Expenses: ${expenses?.length || 0}`);
  console.log(`Payments: ${payments?.length || 0}`);

  process.exit(0);
}

checkMachineData().catch(console.error);
