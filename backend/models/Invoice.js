const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  hsnCode: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, 'Quantity must be greater than 0']
  },
  unit: {
    type: String,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  taxPercent: {
    type: Number,
    default: 0,
    min: [0, 'Tax percentage cannot be negative'],
    max: [100, 'Tax percentage cannot be more than 100']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerAddress: {
    type: String
  },
  customerGST: {
    type: String
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: [0, 'Balance amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  paymentTerms: {
    type: String,
    default: 'Due on receipt'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdBy: 1 });

// Pre-save middleware to calculate totals
invoiceSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    this.taxAmount = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
    this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
    this.balanceAmount = this.totalAmount - this.paidAmount;
  }
  next();
});

// Virtual for payment status
invoiceSchema.virtual('paymentStatus').get(function() {
  if (this.balanceAmount <= 0) return 'Paid';
  if (this.dueDate < new Date()) return 'Overdue';
  return 'Pending';
});

// Ensure virtual fields are serialized
invoiceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
