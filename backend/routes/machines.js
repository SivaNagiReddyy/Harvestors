const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all machines
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select(`
        *,
        machine_owners (
          id,
          name,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single machine
router.get('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select(`
        *,
        machine_owners (
          id,
          name,
          phone
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get machines by owner
router.get('/owner/:ownerId', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('machine_owner_id', req.params.ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create machine
router.post('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .insert([{
        machine_owner_id: req.body.machineOwnerId,
        machine_type: req.body.machineType,
        machine_number: req.body.machineNumber,
        owner_rate_per_hour: req.body.ratePerHour,
        discount_hours: req.body.discountHours || 0,
        driver_name: req.body.driverName,
        driver_phone: req.body.driverPhone,
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

// Update machine
router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .update({
        machine_owner_id: req.body.machineOwnerId,
        machine_type: req.body.machineType,
        machine_number: req.body.machineNumber,
        owner_rate_per_hour: req.body.ratePerHour,
        discount_hours: req.body.discountHours !== undefined ? req.body.discountHours : 0,
        driver_name: req.body.driverName,
        driver_phone: req.body.driverPhone,
        status: req.body.status
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete machine
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('machines')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
