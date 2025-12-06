const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Changed from SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeFarmersPhoneUnique() {
  try {
    console.log('Removing UNIQUE constraint from farmers phone column...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE farmers DROP CONSTRAINT IF EXISTS farmers_phone_key;'
    });
    
    if (error) {
      // Try direct approach if RPC doesn't exist
      console.log('Trying direct SQL execution...');
      const { error: directError } = await supabase
        .from('farmers')
        .select('id')
        .limit(1);
      
      if (directError) {
        console.error('Error:', directError);
      } else {
        console.log('✅ Please run this SQL in Supabase SQL Editor:');
        console.log('ALTER TABLE farmers DROP CONSTRAINT IF EXISTS farmers_phone_key;');
      }
    } else {
      console.log('✅ Successfully removed UNIQUE constraint from farmers phone column');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n📝 Manual SQL to run in Supabase SQL Editor:');
    console.log('ALTER TABLE farmers DROP CONSTRAINT IF EXISTS farmers_phone_key;');
  }
}

removeFarmersPhoneUnique();
