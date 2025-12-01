const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const MachineOwner = require('../models/MachineOwner');
const Farmer = require('../models/Farmer');
const auth = require('../middleware/auth');

// Get all payments
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('machineOwner')
      .populate('farmer')
      .populate('job')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments by type
router.get('/type/:type', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ type: req.params.type })
      .populate('machineOwner')
      .populate('farmer')
      .populate('job');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments by machine owner
router.get('/machine-owner/:ownerId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ machineOwner: req.params.ownerId })
      .populate('machineOwner')
      .populate('job');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments by farmer
router.get('/farmer/:farmerId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ farmer: req.params.farmerId })
      .populate('farmer')
      .populate('job');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create payment
router.post('/', auth, async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();

    // Update machine owner or farmer amounts
    if (payment.type === 'To Machine Owner') {
      await MachineOwner.findByIdAndUpdate(
        payment.machineOwner,
        {
          $inc: {
            totalAmountPaid: payment.amount,
            totalAmountPending: -payment.amount
          }
        }
      );
    } else if (payment.type === 'From Farmer') {
      await Farmer.findByIdAndUpdate(
        payment.farmer,
        {
          $inc: {
            totalAmountPaid: payment.amount,
            totalAmountPending: -payment.amount
          }
        }
      );
    }

    await payment.populate(['machineOwner', 'farmer', 'job']);
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment
router.put('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['machineOwner', 'farmer', 'job']);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete payment
router.delete('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Revert amounts
    if (payment.type === 'To Machine Owner') {
      await MachineOwner.findByIdAndUpdate(
        payment.machineOwner,
        {
          $inc: {
            totalAmountPaid: -payment.amount,
            totalAmountPending: payment.amount
          }
        }
      );
    } else if (payment.type === 'From Farmer') {
      await Farmer.findByIdAndUpdate(
        payment.farmer,
        {
          $inc: {
            totalAmountPaid: -payment.amount,
            totalAmountPending: payment.amount
          }
        }
      );
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
