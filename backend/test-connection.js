require('dotenv').config();
const supabase = require('./config/supabase');

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test if users table exists
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n⚠️  Database tables not created yet!');
      console.log('Please run the schema.sql file in Supabase SQL Editor:');
      console.log('1. Go to https://aaqkafykvhxhmayahidj.supabase.co');
      console.log('2. Click "SQL Editor" in the left sidebar');
      console.log('3. Copy the contents of backend/schema.sql');
      console.log('4. Paste and click "Run"');
    } else {
      console.log('✅ Connection successful!');
      
      // Check if admin exists
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('username, name, role');
      
      if (userError) {
        console.error('Error fetching users:', userError);
      } else {
        console.log(`\nFound ${users.length} user(s):`);
        users.forEach(u => console.log(`  - ${u.username} (${u.role})`));
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testConnection();
