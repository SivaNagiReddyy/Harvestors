const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all machine owners
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machine_owners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single machine owner
router.get('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machine_owners')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Machine owner not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create machine owner
router.post('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machine_owners')
      .insert([{
        name: req.body.name,
        phone: req.body.phone,
        bank_account_holder_name: req.body.bankAccountHolderName,
        bank_account_number: req.body.bankAccountNumber,
        bank_name: req.body.bankName,
        bank_ifsc_code: req.body.bankIfscCode,
        status: req.body.status || 'Active'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update machine owner
router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machine_owners')
      .update({
        name: req.body.name,
        phone: req.body.phone,
        bank_account_holder_name: req.body.bankAccountHolderName,
        bank_account_number: req.body.bankAccountNumber,
        bank_name: req.body.bankName,
        bank_ifsc_code: req.body.bankIfscCode,
        status: req.body.status
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Machine owner not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete machine owner
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('machine_owners')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Machine owner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
