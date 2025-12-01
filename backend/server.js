require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
});

const supabase = require('./config/supabase');

// Test Supabase connection
supabase.from('users').select('count').single()
  .then(() => console.log('✅ Connected to Supabase'))
  .catch((err) => console.log('⚠️  Supabase tables not yet created. Run schema.sql in Supabase SQL Editor'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/machine-owners', require('./routes/machineOwners'));
app.use('/api/machines', require('./routes/machines'));
app.use('/api/farmers', require('./routes/farmers'));
app.use('/api/fields', require('./routes/fields'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/advances', require('./routes/advances'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/dealers', require('./routes/dealers'));
app.use('/api/rentals', require('./routes/rentals'));
app.use('/api/rental-payments', require('./routes/rentalPayments'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', database: 'Supabase' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
