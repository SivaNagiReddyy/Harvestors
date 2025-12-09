const supabase = require('./config/supabase');

async function checkExpenses() {
  const { data: expenses } = await supabase
    .from('daily_expenses')
    .select('*');
  
  const total = expenses?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0;
  
  console.log('\n=== EXPENSES ANALYSIS ===');
  console.log(`Total expenses: ${expenses?.length || 0} records`);
  console.log(`Total amount: ₹${total.toLocaleString('en-IN')}`);
  
  if (expenses && expenses.length > 0) {
    console.log('\nSample expenses:');
    expenses.slice(0, 5).forEach(e => {
      console.log(`  ₹${e.amount} - Machine: ${e.machine_id}`);
    });
  }
  
  // Check what we calculated before
  const { data: jobs } = await supabase
    .from('harvesting_jobs')
    .select('total_amount, hours, machines!inner(owner_rate_per_hour)');
  
  const revenue = jobs?.reduce((sum, j) => sum + parseFloat(j.total_amount || 0), 0) || 0;
  const ownerCost = jobs?.reduce((sum, j) => {
    return sum + (parseFloat(j.hours || 0) * parseFloat(j.machines?.owner_rate_per_hour || 0));
  }, 0) || 0;
  
  console.log('\n=== CALCULATION BREAKDOWN ===');
  console.log(`Revenue: ₹${revenue.toLocaleString('en-IN')}`);
  console.log(`Owner Cost: ₹${ownerCost.toLocaleString('en-IN')}`);
  console.log(`Expenses: ₹${total.toLocaleString('en-IN')}`);
  console.log(`Profit (Rev - Owner - Exp): ₹${(revenue - ownerCost - total).toLocaleString('en-IN')}`);
  console.log(`Profit (Rev - Owner): ₹${(revenue - ownerCost).toLocaleString('en-IN')}`);
  
  process.exit(0);
}

checkExpenses();
