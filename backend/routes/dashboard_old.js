const express = require('express');
const router = express.Router();
const HarvestingJob = require('../models/HarvestingJob');
const Payment = require('../models/Payment');
const MachineOwner = require('../models/MachineOwner');
const Farmer = require('../models/Farmer');
const auth = require('../middleware/auth');

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    // Count statistics
    const totalMachineOwners = await MachineOwner.countDocuments({ status: 'Active' });
    const totalFarmers = await Farmer.countDocuments({ status: 'Active' });
    const totalJobs = await HarvestingJob.countDocuments();
    const completedJobs = await HarvestingJob.countDocuments({ status: 'Completed' });
    const pendingJobs = await HarvestingJob.countDocuments({ status: { $in: ['Scheduled', 'In Progress'] } });

    // Financial statistics
    const totalPaymentsToOwners = await Payment.aggregate([
      { $match: { type: 'To Machine Owner', status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPaymentsFromFarmers = await Payment.aggregate([
      { $match: { type: 'From Farmer', status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingPaymentsToOwners = await MachineOwner.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmountPending' } } }
    ]);

    const pendingPaymentsFromFarmers = await Farmer.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmountPending' } } }
    ]);

    // Recent jobs
    const recentJobs = await HarvestingJob.find()
      .populate('field')
      .populate('farmer')
      .populate('machineOwner')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent payments
    const recentPayments = await Payment.find()
      .populate('machineOwner')
      .populate('farmer')
      .populate('job')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      counts: {
        totalMachineOwners,
        totalFarmers,
        totalJobs,
        completedJobs,
        pendingJobs
      },
      financials: {
        totalPaidToOwners: totalPaymentsToOwners[0]?.total || 0,
        totalReceivedFromFarmers: totalPaymentsFromFarmers[0]?.total || 0,
        pendingToOwners: pendingPaymentsToOwners[0]?.total || 0,
        pendingFromFarmers: pendingPaymentsFromFarmers[0]?.total || 0,
        profit: (totalPaymentsFromFarmers[0]?.total || 0) - (totalPaymentsToOwners[0]?.total || 0)
      },
      recentJobs,
      recentPayments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
