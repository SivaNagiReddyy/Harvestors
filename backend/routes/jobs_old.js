const express = require('express');
const router = express.Router();
const HarvestingJob = require('../models/HarvestingJob');
const Field = require('../models/Field');
const MachineOwner = require('../models/MachineOwner');
const Farmer = require('../models/Farmer');
const auth = require('../middleware/auth');

// Get all jobs
router.get('/', auth, async (req, res) => {
  try {
    const jobs = await HarvestingJob.find()
      .populate('field')
      .populate('farmer')
      .populate('machineOwner')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs by machine owner
router.get('/machine-owner/:ownerId', auth, async (req, res) => {
  try {
    const jobs = await HarvestingJob.find({ machineOwner: req.params.ownerId })
      .populate('field')
      .populate('farmer')
      .populate('machineOwner');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs by farmer
router.get('/farmer/:farmerId', auth, async (req, res) => {
  try {
    const jobs = await HarvestingJob.find({ farmer: req.params.farmerId })
      .populate('field')
      .populate('farmer')
      .populate('machineOwner');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single job
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await HarvestingJob.findById(req.params.id)
      .populate('field')
      .populate('farmer')
      .populate('machineOwner');
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create job
router.post('/', auth, async (req, res) => {
  try {
    const job = new HarvestingJob(req.body);
    await job.save();

    // Update field status to Assigned
    await Field.findByIdAndUpdate(req.body.field, { status: 'Assigned' });

    // Update machine owner pending amount
    await MachineOwner.findByIdAndUpdate(
      req.body.machineOwner,
      { $inc: { totalAmountPending: req.body.totalAmount } }
    );

    // Update farmer pending amount
    await Farmer.findByIdAndUpdate(
      req.body.farmer,
      { $inc: { totalAmountPending: req.body.totalAmount } }
    );

    await job.populate(['field', 'farmer', 'machineOwner']);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update job
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await HarvestingJob.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['field', 'farmer', 'machineOwner']);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // If job is completed, update field status
    if (req.body.status === 'Completed') {
      await Field.findByIdAndUpdate(job.field._id, { status: 'Completed' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete job
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await HarvestingJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Revert field status
    await Field.findByIdAndUpdate(job.field, { status: 'Available' });

    // Revert machine owner pending amount
    await MachineOwner.findByIdAndUpdate(
      job.machineOwner,
      { $inc: { totalAmountPending: -job.totalAmount } }
    );

    // Revert farmer pending amount
    await Farmer.findByIdAndUpdate(
      job.farmer,
      { $inc: { totalAmountPending: -job.totalAmount } }
    );

    await HarvestingJob.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
