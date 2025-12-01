const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all farmers
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single farmer
router.get('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Farmer not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create farmer
router.post('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('farmers')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update farmer
router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('farmers')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Farmer not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete farmer
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('farmers')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Farmer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
