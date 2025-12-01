const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all machine rentals
router.get('/', auth, async (req, res) => {
  try {
    const { data: rentals, error } = await supabase
      .from('machine_rentals')
      .select(`
        *,
        dealer:dealers(*),
        machine:machines(*, machine_owners(*))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rental by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: rental, error } = await supabase
      .from('machine_rentals')
      .select(`
        *,
        dealer:dealers(*),
        machine:machines(*, machine_owners(*))
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    res.json(rental);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rentals by dealer
router.get('/dealer/:dealerId', auth, async (req, res) => {
  try {
    const { data: rentals, error } = await supabase
      .from('machine_rentals')
      .select(`
        *,
        dealer:dealers(*),
        machine:machines(*, machine_owners(*))
      `)
      .eq('dealer_id', req.params.dealerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rentals by machine
router.get('/machine/:machineId', auth, async (req, res) => {
  try {
    const { data: rentals, error } = await supabase
      .from('machine_rentals')
      .select(`
        *,
        dealer:dealers(*),
        machine:machines(*, machine_owners(*))
      `)
      .eq('machine_id', req.params.machineId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create rental
router.post('/', auth, async (req, res) => {
  try {
    const { data: rental, error } = await supabase
      .from('machine_rentals')
      .insert(req.body)
      .select(`
        *,
        dealer:dealers(*),
        machine:machines(*, machine_owners(*))
      `)
      .single();

    if (error) throw error;
    res.status(201).json(rental);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update rental (typically to update hours and complete season)
router.put('/:id', auth, async (req, res) => {
  try {
    const { data: rental, error } = await supabase
      .from('machine_rentals')
      .update(req.body)
      .eq('id', req.params.id)
      .select(`
        *,
        dealer:dealers(*),
        machine:machines(*, machine_owners(*))
      `)
      .single();

    if (error) throw error;
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    res.json(rental);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete rental
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('machine_rentals')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Rental deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
