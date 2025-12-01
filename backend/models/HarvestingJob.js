const mongoose = require('mongoose');

const harvestingJobSchema = new mongoose.Schema({
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  machineOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MachineOwner',
    required: true
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  hours: {
    type: Number,
    required: true
  },
  ratePerHour: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
harvestingJobSchema.pre('save', function(next) {
  this.totalAmount = this.hours * this.ratePerHour;
  next();
});

module.exports = mongoose.model('HarvestingJob', harvestingJobSchema);
