const mongoose = require('mongoose');

const machineOwnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  machineType: {
    type: String,
    required: true,
    enum: ['Combine Harvester', 'Tractor', 'Paddy Harvester', 'Wheat Harvester', 'Other']
  },
  machineModel: {
    type: String,
    trim: true
  },
  machineNumber: {
    type: String,
    required: true,
    unique: true
  },
  ratePerHour: {
    type: Number,
    required: true
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String
  },
  totalAmountPending: {
    type: Number,
    default: 0
  },
  totalAmountPaid: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MachineOwner', machineOwnerSchema);
