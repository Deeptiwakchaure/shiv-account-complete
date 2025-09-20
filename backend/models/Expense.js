const mongoose = require('mongoose');

const expenseItemSchema = new mongoose.Schema({
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

const expenseSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  vendorName: {
    type: String,
    required: true
  },
  vendorEmail: {
    type: String,
    required: true
  },
  vendorAddress: {
    type: String
  },
  vendorGST: {
    type: String
  },
  billDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [expenseItemSchema],
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
    enum: ['Draft', 'Approved', 'Paid', 'Overdue', 'Cancelled'],
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
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
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
expenseSchema.index({ billNumber: 1 });
expenseSchema.index({ vendor: 1 });
expenseSchema.index({ billDate: -1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ createdBy: 1 });

// Pre-save middleware to calculate totals
expenseSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    this.taxAmount = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
    this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
    this.balanceAmount = this.totalAmount - this.paidAmount;
  }
  next();
});

// Virtual for payment status
expenseSchema.virtual('paymentStatus').get(function() {
  if (this.balanceAmount <= 0) return 'Paid';
  if (this.dueDate < new Date()) return 'Overdue';
  return 'Pending';
});

// Ensure virtual fields are serialized
expenseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);
