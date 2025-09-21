const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
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
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Received quantity cannot be negative']
  }
});

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
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
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  },
  items: [purchaseOrderItemSchema],
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
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Confirmed', 'Partially Received', 'Received', 'Cancelled'],
    default: 'Draft'
  },
  deliveryAddress: {
    type: String,
    required: true,
    default: 'Default delivery address'
  },
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
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
purchaseOrderSchema.index({ orderNumber: 1 });
purchaseOrderSchema.index({ vendor: 1 });
purchaseOrderSchema.index({ orderDate: -1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ createdBy: 1 });

// Pre-save middleware to calculate totals
purchaseOrderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    this.taxAmount = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
    this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  }
  next();
});

// Virtual for completion percentage
purchaseOrderSchema.virtual('completionPercentage').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  
  const totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const receivedQuantity = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  
  return totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0;
});

// Virtual for delivery status
purchaseOrderSchema.virtual('deliveryStatus').get(function() {
  const completion = this.completionPercentage;
  if (completion === 0) return 'Pending';
  if (completion < 100) return 'Partially Received';
  return 'Completed';
});

// Ensure virtual fields are serialized
purchaseOrderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
