const express = require('express');
const router = express.Router();
const Field = require('../models/Field');
const Farmer = require('../models/Farmer');
const auth = require('../middleware/auth');

// Get all fields
router.get('/', auth, async (req, res) => {
  try {
    const fields = await Field.find().populate('farmer').sort({ createdAt: -1 });
    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fields by farmer
router.get('/farmer/:farmerId', auth, async (req, res) => {
  try {
    const fields = await Field.find({ farmer: req.params.farmerId }).populate('farmer');
    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single field
router.get('/:id', auth, async (req, res) => {
  try {
    const field = await Field.findById(req.params.id).populate('farmer');
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }
    res.json(field);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create field
router.post('/', auth, async (req, res) => {
  try {
    const field = new Field(req.body);
    await field.save();
    await field.populate('farmer');
    res.status(201).json(field);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update field
router.put('/:id', auth, async (req, res) => {
  try {
    const field = await Field.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('farmer');
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }
    res.json(field);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete field
router.delete('/:id', auth, async (req, res) => {
  try {
    const field = await Field.findByIdAndDelete(req.params.id);
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }
    res.json({ message: 'Field deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
