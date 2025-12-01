require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

async function testLogin() {
  try {
    const username = 'admin';
    const password = 'Krish@143';
    
    console.log('Testing login with:');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('');
    
    // Fetch user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      console.error('❌ Error fetching user:', error.message);
      return;
    }
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.username);
    console.log('Password hash in DB:', user.password.substring(0, 20) + '...');
    
    // Test password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('\nPassword match:', isMatch ? '✅ YES' : '❌ NO');
    
    if (isMatch) {
      console.log('\n✅ Login should work!');
    } else {
      console.log('\n❌ Password does not match!');
      console.log('Let me test with "admin123"...');
      
      const isOldPassword = await bcrypt.compare('admin123', user.password);
      console.log('Old password match:', isOldPassword ? '✅ YES' : '❌ NO');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
