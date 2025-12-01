const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://aaqkafykvhxhmayahidj.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcWthZnlrdmh4aG1heWFoaWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NzE2OTksImV4cCI6MjA3OTQ0NzY5OX0.-fVextZt9XWbEMz_Kg3e3mBNtlHMU8qm-EF9Nh57M-w';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
