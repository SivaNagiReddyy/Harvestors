const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['To Machine Owner', 'From Farmer'],
    required: true
  },
  machineOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MachineOwner'
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer'
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HarvestingJob',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque'],
    required: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Completed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
