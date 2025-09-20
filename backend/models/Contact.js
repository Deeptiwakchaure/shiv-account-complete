const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  type: {
    type: String,
    enum: ['Customer', 'Vendor', 'Both'],
    required: [true, 'Contact type is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid mobile number']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot be more than 500 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City cannot be more than 50 characters']
  },
  state: {
    type: String,
    trim: true,
    maxlength: [50, 'State cannot be more than 50 characters']
  },
  pincode: {
    type: String,
    match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
  },
  gstNumber: {
    type: String,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
  },
  panNumber: {
    type: String,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }
}, {
  timestamps: true
});

// Index for better query performance
contactSchema.index({ email: 1 });
contactSchema.index({ mobile: 1 });
contactSchema.index({ type: 1 });
contactSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('Contact', contactSchema);
