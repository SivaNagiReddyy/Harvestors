const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { sendSMS, sendEmail, generateOTP } = require('../utils/notifications');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register (first time setup)
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        username,
        password: hashedPassword,
        name,
        role: role || 'Manager'
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password - Request OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(username, { otp, expiresAt });

    // Send SMS and Email
    const phone = '9542477945';
    const email = 'sivanagi318@gmail.com';
    
    const smsMessage = `Your password reset OTP is: ${otp}. Valid for 10 minutes.`;
    const emailSubject = 'Password Reset OTP - Harvester Dealership';
    const emailMessage = `Hello ${user.name},\n\nYour password reset OTP is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you didn't request this, please ignore this message.\n\nRegards,\nHarvester Dealership Team`;

    await sendSMS(phone, smsMessage);
    await sendEmail(email, emailSubject, emailMessage);

    res.json({ 
      message: 'OTP sent to registered phone and email',
      username: username
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { username, otp } = req.body;

    const stored = otpStore.get(username);
    
    if (!stored) {
      return res.status(400).json({ error: 'No OTP request found' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(username);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP is valid
    res.json({ message: 'OTP verified successfully', username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { username, otp, newPassword } = req.body;

    const stored = otpStore.get(username);
    
    if (!stored) {
      return res.status(400).json({ error: 'No OTP request found' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(username);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('username', username);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Clear OTP
    otpStore.delete(username);

    // Send confirmation
    const phone = '9542477945';
    const email = 'sivanagi318@gmail.com';
    
    await sendSMS(phone, 'Your password has been successfully reset.');
    await sendEmail(email, 'Password Reset Successful', 'Your password has been successfully reset. If you didn\'t make this change, please contact support immediately.');

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
