const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  },
  type: {
    type: String,
    enum: ['Goods', 'Service'],
    required: [true, 'Product type is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot be more than 100 characters']
  },
  hsnCode: {
    type: String,
    required: [true, 'HSN code is required'],
    trim: true,
    match: [/^\d{4,8}$/, 'Please enter a valid HSN code (4-8 digits)']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['PCS', 'KG', 'LTR', 'MTR', 'SFT', 'CBM', 'BOX', 'SET', 'PAIR', 'DOZEN', 'HOUR', 'DAY', 'MONTH', 'YEAR']
  },
  salesPrice: {
    type: Number,
    required: [true, 'Sales price is required'],
    min: [0, 'Sales price cannot be negative']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  salesTaxPercent: {
    type: Number,
    default: 0,
    min: [0, 'Tax percentage cannot be negative'],
    max: [100, 'Tax percentage cannot be more than 100']
  },
  purchaseTaxPercent: {
    type: Number,
    default: 0,
    min: [0, 'Tax percentage cannot be negative'],
    max: [100, 'Tax percentage cannot be more than 100']
  },
  openingStock: {
    type: Number,
    default: 0,
    min: [0, 'Opening stock cannot be negative']
  },
  currentStock: {
    type: Number,
    default: 0,
    min: [0, 'Current stock cannot be negative']
  },
  minimumStock: {
    type: Number,
    default: 0,
    min: [0, 'Minimum stock cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  images: [{
    type: String,
    default: []
  }],
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for better query performance
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ hsnCode: 1 });
productSchema.index({ type: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.currentStock === 0) return 'Out of Stock';
  if (this.currentStock <= this.minimumStock) return 'Low Stock';
  return 'In Stock';
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
