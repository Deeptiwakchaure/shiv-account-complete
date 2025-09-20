const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ['Purchase', 'Sale', 'Adjustment', 'Transfer', 'Return', 'Damage', 'Opening'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  totalValue: {
    type: Number,
    required: true
  },
  referenceDocument: {
    documentType: {
      type: String,
      enum: ['PurchaseOrder', 'SalesOrder', 'Invoice', 'Expense', 'Adjustment']
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId
    },
    documentNumber: String
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  currentStock: {
    type: Number,
    default: 0,
    min: [0, 'Current stock cannot be negative']
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: [0, 'Reserved stock cannot be negative']
  },
  availableStock: {
    type: Number,
    default: 0,
    min: [0, 'Available stock cannot be negative']
  },
  minimumStock: {
    type: Number,
    default: 0,
    min: [0, 'Minimum stock cannot be negative']
  },
  maximumStock: {
    type: Number,
    default: 0,
    min: [0, 'Maximum stock cannot be negative']
  },
  reorderLevel: {
    type: Number,
    default: 0,
    min: [0, 'Reorder level cannot be negative']
  },
  reorderQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Reorder quantity cannot be negative']
  },
  averageCost: {
    type: Number,
    default: 0,
    min: [0, 'Average cost cannot be negative']
  },
  totalValue: {
    type: Number,
    default: 0,
    min: [0, 'Total value cannot be negative']
  },
  lastPurchasePrice: {
    type: Number,
    default: 0,
    min: [0, 'Last purchase price cannot be negative']
  },
  lastPurchaseDate: {
    type: Date
  },
  lastSalePrice: {
    type: Number,
    default: 0,
    min: [0, 'Last sale price cannot be negative']
  },
  lastSaleDate: {
    type: Date
  },
  location: {
    warehouse: {
      type: String,
      default: 'Main Warehouse'
    },
    rack: String,
    bin: String
  },
  transactions: [inventoryTransactionSchema],
  stockAlerts: {
    lowStockAlert: {
      type: Boolean,
      default: true
    },
    overStockAlert: {
      type: Boolean,
      default: false
    },
    expiryAlert: {
      type: Boolean,
      default: false
    }
  },
  batchTracking: {
    enabled: {
      type: Boolean,
      default: false
    },
    batches: [{
      batchNumber: String,
      quantity: Number,
      expiryDate: Date,
      manufactureDate: Date,
      supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact'
      }
    }]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
inventorySchema.index({ product: 1 });
inventorySchema.index({ currentStock: 1 });
inventorySchema.index({ 'location.warehouse': 1 });
inventorySchema.index({ lastUpdated: -1 });

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.currentStock === 0) return 'Out of Stock';
  if (this.currentStock <= this.minimumStock) return 'Low Stock';
  if (this.maximumStock > 0 && this.currentStock >= this.maximumStock) return 'Over Stock';
  if (this.currentStock <= this.reorderLevel) return 'Reorder Required';
  return 'In Stock';
});

// Virtual for stock health
inventorySchema.virtual('stockHealth').get(function() {
  const status = this.stockStatus;
  if (status === 'Out of Stock') return 'Critical';
  if (status === 'Low Stock' || status === 'Reorder Required') return 'Warning';
  if (status === 'Over Stock') return 'Attention';
  return 'Good';
});

// Virtual for turnover rate (simplified calculation)
inventorySchema.virtual('turnoverRate').get(function() {
  if (!this.transactions || this.transactions.length === 0) return 0;
  
  const salesTransactions = this.transactions.filter(t => t.transactionType === 'Sale');
  const totalSold = salesTransactions.reduce((sum, t) => sum + Math.abs(t.quantity), 0);
  
  return this.averageCost > 0 ? totalSold / this.currentStock : 0;
});

// Method to add transaction
inventorySchema.methods.addTransaction = function(transactionData) {
  this.transactions.push(transactionData);
  this.updateStock(transactionData);
  this.lastUpdated = new Date();
  return this.save();
};

// Method to update stock based on transaction
inventorySchema.methods.updateStock = function(transaction) {
  const { transactionType, quantity, unitPrice } = transaction;
  
  switch (transactionType) {
    case 'Purchase':
    case 'Return':
    case 'Adjustment':
      if (quantity > 0) {
        // Calculate new average cost using weighted average
        const newTotalValue = this.totalValue + (quantity * unitPrice);
        const newTotalQuantity = this.currentStock + quantity;
        this.averageCost = newTotalQuantity > 0 ? newTotalValue / newTotalQuantity : 0;
        this.currentStock = newTotalQuantity;
        this.totalValue = newTotalValue;
        this.lastPurchasePrice = unitPrice;
        this.lastPurchaseDate = new Date();
      }
      break;
      
    case 'Sale':
    case 'Damage':
      if (quantity > 0 && this.currentStock >= quantity) {
        this.currentStock -= quantity;
        this.totalValue = this.currentStock * this.averageCost;
        if (transactionType === 'Sale') {
          this.lastSalePrice = unitPrice;
          this.lastSaleDate = new Date();
        }
      }
      break;
      
    case 'Opening':
      this.currentStock = quantity;
      this.averageCost = unitPrice;
      this.totalValue = quantity * unitPrice;
      break;
  }
  
  // Update available stock (current - reserved)
  this.availableStock = Math.max(0, this.currentStock - this.reservedStock);
};

// Method to reserve stock
inventorySchema.methods.reserveStock = function(quantity) {
  if (this.availableStock >= quantity) {
    this.reservedStock += quantity;
    this.availableStock -= quantity;
    return this.save();
  }
  throw new Error('Insufficient stock available for reservation');
};

// Method to release reserved stock
inventorySchema.methods.releaseReservedStock = function(quantity) {
  const releaseQuantity = Math.min(quantity, this.reservedStock);
  this.reservedStock -= releaseQuantity;
  this.availableStock += releaseQuantity;
  return this.save();
};

// Pre-save middleware to update calculated fields
inventorySchema.pre('save', function(next) {
  this.availableStock = Math.max(0, this.currentStock - this.reservedStock);
  this.totalValue = this.currentStock * this.averageCost;
  next();
});

// Ensure virtual fields are serialized
inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
