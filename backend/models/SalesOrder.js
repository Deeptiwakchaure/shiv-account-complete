const mongoose = require('mongoose');

const salesOrderItemSchema = new mongoose.Schema({
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
  deliveredQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Delivered quantity cannot be negative']
  }
});

const salesOrderSchema = new mongoose.Schema({
  orderNumber: {
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
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  items: [salesOrderItemSchema],
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
    enum: ['Draft', 'Confirmed', 'In Production', 'Ready to Ship', 'Partially Delivered', 'Delivered', 'Cancelled'],
    default: 'Draft'
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  paymentTerms: {
    type: String,
    default: 'Due on delivery'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
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
salesOrderSchema.index({ orderNumber: 1 });
salesOrderSchema.index({ customer: 1 });
salesOrderSchema.index({ orderDate: -1 });
salesOrderSchema.index({ status: 1 });
salesOrderSchema.index({ priority: 1 });
salesOrderSchema.index({ createdBy: 1 });

// Pre-save middleware to calculate totals
salesOrderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    this.taxAmount = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
    this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  }
  next();
});

// Virtual for completion percentage
salesOrderSchema.virtual('completionPercentage').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  
  const totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveredQuantity = this.items.reduce((sum, item) => sum + item.deliveredQuantity, 0);
  
  return totalQuantity > 0 ? Math.round((deliveredQuantity / totalQuantity) * 100) : 0;
});

// Virtual for delivery status
salesOrderSchema.virtual('deliveryStatus').get(function() {
  const completion = this.completionPercentage;
  if (completion === 0) return 'Pending';
  if (completion < 100) return 'Partially Delivered';
  return 'Completed';
});

// Virtual for urgency level
salesOrderSchema.virtual('urgencyLevel').get(function() {
  const daysUntilDelivery = Math.ceil((this.expectedDeliveryDate - new Date()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDelivery < 0) return 'Overdue';
  if (daysUntilDelivery <= 3) return 'Critical';
  if (daysUntilDelivery <= 7) return 'High';
  if (daysUntilDelivery <= 14) return 'Medium';
  return 'Low';
});

// Ensure virtual fields are serialized
salesOrderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
