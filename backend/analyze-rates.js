const supabase = require('./config/supabase');

async function analyzeRates() {
  const { data: jobs } = await supabase
    .from('harvesting_jobs')
    .select('id, hours, rate_per_hour, total_amount, machine_id, machines!inner(machine_number, owner_rate_per_hour)');
  
  console.log('\n=== RATE ANALYSIS ===');
  console.log(`Total jobs: ${jobs?.length || 0}\n`);
  
  let profitableJobs = 0;
  let breakEvenJobs = 0;
  let losingJobs = 0;
  
  jobs?.forEach(job => {
    const farmerRate = parseFloat(job.rate_per_hour || 0);
    const ownerRate = parseFloat(job.machines?.owner_rate_per_hour || 0);
    const marginPerHour = farmerRate - ownerRate;
    const totalProfit = marginPerHour * parseFloat(job.hours || 0);
    
    if (marginPerHour > 0) profitableJobs++;
    else if (marginPerHour === 0) breakEvenJobs++;
    else losingJobs++;
    
    if (marginPerHour <= 0) {
      console.log(`⚠️  Machine ${job.machines?.machine_number}:`);
      console.log(`    Farmer Rate: ₹${farmerRate}/hr`);
      console.log(`    Owner Rate: ₹${ownerRate}/hr`);
      console.log(`    Margin: ₹${marginPerHour}/hr`);
      console.log(`    Hours: ${job.hours}`);
      console.log(`    Profit/Loss: ₹${totalProfit.toFixed(2)}`);
      console.log('');
    }
  });
  
  console.log('\n=== SUMMARY ===');
  console.log(`Profitable jobs: ${profitableJobs}`);
  console.log(`Break-even jobs: ${breakEvenJobs}`);
  console.log(`Losing jobs: ${losingJobs}`);
  
  // Get unique machines and their rates
  const machineRates = {};
  jobs?.forEach(job => {
    const machineId = job.machine_id;
    const machineName = job.machines?.machine_number;
    const farmerRate = parseFloat(job.rate_per_hour || 0);
    const ownerRate = parseFloat(job.machines?.owner_rate_per_hour || 0);
    
    if (!machineRates[machineId]) {
      machineRates[machineId] = { 
        name: machineName,
        ownerRate,
        farmerRates: new Set()
      };
    }
    machineRates[machineId].farmerRates.add(farmerRate);
  });
  
  console.log('\n=== MACHINE RATES ===');
  Object.values(machineRates).forEach(machine => {
    console.log(`Machine: ${machine.name}`);
    console.log(`  Owner Rate: ₹${machine.ownerRate}/hr`);
    console.log(`  Farmer Rates used: ${[...machine.farmerRates].join(', ')}`);
    const margins = [...machine.farmerRates].map(fr => fr - machine.ownerRate);
    console.log(`  Margins: ${margins.map(m => '₹' + m).join(', ')}`);
    console.log('');
  });
  
  process.exit(0);
}

analyzeRates();
