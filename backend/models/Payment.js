const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['Payment', 'Receipt'],
    required: true
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  contactName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0']
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card', 'Debit Card', 'Online'],
    required: true
  },
  bankAccount: {
    type: String,
    required: function() {
      return ['Bank Transfer', 'Cheque'].includes(this.paymentMethod);
    }
  },
  chequeNumber: {
    type: String,
    required: function() {
      return this.paymentMethod === 'Cheque';
    }
  },
  chequeDate: {
    type: Date,
    required: function() {
      return this.paymentMethod === 'Cheque';
    }
  },
  upiTransactionId: {
    type: String,
    required: function() {
      return this.paymentMethod === 'UPI';
    }
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Cleared', 'Bounced', 'Cancelled'],
    default: 'Cleared'
  },
  // For linking to invoices/bills
  linkedDocuments: [{
    documentType: {
      type: String,
      enum: ['Invoice', 'Expense', 'PurchaseOrder', 'SalesOrder'],
      required: true
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    documentNumber: {
      type: String,
      required: true
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: [0, 'Allocated amount cannot be negative']
    }
  }],
  totalAllocated: {
    type: Number,
    default: 0,
    min: [0, 'Total allocated cannot be negative']
  },
  unallocatedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Unallocated amount cannot be negative']
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ contact: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ createdBy: 1 });

// Pre-save middleware to calculate unallocated amount
paymentSchema.pre('save', function(next) {
  if (this.linkedDocuments && this.linkedDocuments.length > 0) {
    this.totalAllocated = this.linkedDocuments.reduce((sum, doc) => sum + doc.allocatedAmount, 0);
  } else {
    this.totalAllocated = 0;
  }
  this.unallocatedAmount = this.amount - this.totalAllocated;
  next();
});

// Virtual for allocation status
paymentSchema.virtual('allocationStatus').get(function() {
  if (this.unallocatedAmount === this.amount) return 'Unallocated';
  if (this.unallocatedAmount > 0) return 'Partially Allocated';
  return 'Fully Allocated';
});

// Virtual for payment status description
paymentSchema.virtual('statusDescription').get(function() {
  const statusMap = {
    'Pending': 'Payment is pending clearance',
    'Cleared': 'Payment has been cleared',
    'Bounced': 'Payment has bounced',
    'Cancelled': 'Payment has been cancelled'
  };
  return statusMap[this.status] || 'Unknown status';
});

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);
