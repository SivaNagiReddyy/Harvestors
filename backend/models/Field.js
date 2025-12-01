const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  village: {
    type: String,
    required: true,
    trim: true
  },
  surveyNumber: {
    type: String,
    trim: true
  },
  acres: {
    type: Number,
    required: true
  },
  cropType: {
    type: String,
    required: true,
    enum: ['Paddy', 'Wheat', 'Corn', 'Cotton', 'Sugarcane', 'Other']
  },
  status: {
    type: String,
    enum: ['Available', 'Assigned', 'Completed'],
    default: 'Available'
  },
  ratePerHour: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
fieldSchema.pre('save', function(next) {
  this.totalAmount = this.acres * this.ratePerHour;
  next();
});

module.exports = mongoose.model('Field', fieldSchema);
