const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all fields with farmer details
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fields')
      .select(`
        *,
        farmer:farmers(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fields by farmer
router.get('/farmer/:farmerId', auth, async (req, res) => {
  try {
    const { data, error} = await supabase
      .from('fields')
      .select(`
        *,
        farmer:farmers(*)
      `)
      .eq('farmer_id', req.params.farmerId);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single field
router.get('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fields')
      .select(`
        *,
        farmer:farmers(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Field not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create field
router.post('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fields')
      .insert([{
        farmer_id: req.body.farmer,
        location: req.body.location,
        village: req.body.village,
        survey_number: req.body.surveyNumber,
        acres: req.body.acres,
        crop_type: req.body.cropType,
        rate_per_hour: req.body.ratePerHour,
        status: req.body.status || 'Available'
      }])
      .select(`
        *,
        farmer:farmers(*)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update field
router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fields')
      .update({
        farmer_id: req.body.farmer,
        location: req.body.location,
        village: req.body.village,
        survey_number: req.body.surveyNumber,
        acres: req.body.acres,
        crop_type: req.body.cropType,
        rate_per_hour: req.body.ratePerHour,
        status: req.body.status
      })
      .eq('id', req.params.id)
      .select(`
        *,
        farmer:farmers(*)
      `)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Field not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete field
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('fields')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Field deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
