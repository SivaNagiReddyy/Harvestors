require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

const createAdminUser = async () => {
  try {
    console.log('Connected to Supabase');

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Krish@143', 10);

    // Create admin user
    const { data: admin, error } = await supabase
      .from('users')
      .insert({
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator',
        role: 'Admin'
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: Krish@143');
    console.log('\n⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
