const supabase = require('./config/supabase');

async function checkSchema() {
  // Check machines columns
  const { data: machines } = await supabase.from('machines').select('*').limit(1);
  console.log('\n=== MACHINES TABLE COLUMNS ===');
  console.log(Object.keys(machines?.[0] || {}));
  console.log('\nSample machine:', machines?.[0]);
  
  // Check harvesting_jobs columns
  const { data: jobs } = await supabase.from('harvesting_jobs').select('*').limit(1);
  console.log('\n=== HARVESTING_JOBS TABLE COLUMNS ===');
  console.log(Object.keys(jobs?.[0] || {}));
  console.log('\nSample job:', jobs?.[0]);
  
  process.exit(0);
}

checkSchema();
