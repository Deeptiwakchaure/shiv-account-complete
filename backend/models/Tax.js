const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tax name is required'],
    trim: true,
    maxlength: [100, 'Tax name cannot be more than 100 characters']
  },
  type: {
    type: String,
    enum: ['GST', 'IGST', 'CGST', 'SGST', 'UTGST', 'CESS', 'TDS', 'TCS', 'VAT', 'Service Tax'],
    required: [true, 'Tax type is required']
  },
  rate: {
    type: Number,
    required: [true, 'Tax rate is required'],
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot be more than 100']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  applicableOn: {
    type: String,
    enum: ['Sales', 'Purchase', 'Both'],
    default: 'Both'
  },
  isCompound: {
    type: Boolean,
    default: false
  },
  compoundOn: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tax'
  }],
  hsnCodes: [{
    type: String,
    trim: true
  }],
  effectiveFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  effectiveTo: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
taxSchema.index({ name: 1 });
taxSchema.index({ type: 1 });
taxSchema.index({ applicableOn: 1 });
taxSchema.index({ isActive: 1 });
taxSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

// Virtual for current status
taxSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  if (this.effectiveFrom > now) return 'Future';
  if (this.effectiveTo && this.effectiveTo < now) return 'Expired';
  return 'Active';
});

// Method to check if tax is applicable for a date
taxSchema.methods.isApplicableOn = function(date) {
  const checkDate = date || new Date();
  return this.effectiveFrom <= checkDate && 
         (!this.effectiveTo || this.effectiveTo >= checkDate) &&
         this.isActive;
};

// Method to calculate tax amount
taxSchema.methods.calculateTax = function(baseAmount, compoundTaxes = []) {
  let taxableAmount = baseAmount;
  
  if (this.isCompound && compoundTaxes.length > 0) {
    const compoundTaxAmount = compoundTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    taxableAmount = baseAmount + compoundTaxAmount;
  }
  
  return (taxableAmount * this.rate) / 100;
};

// Ensure virtual fields are serialized
taxSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Tax', taxSchema);
