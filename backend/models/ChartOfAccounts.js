const mongoose = require('mongoose');

const chartOfAccountsSchema = new mongoose.Schema({
  accountCode: {
    type: String,
    required: [true, 'Account code is required'],
    unique: true,
    trim: true,
    maxlength: [20, 'Account code cannot be more than 20 characters']
  },
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [200, 'Account name cannot be more than 200 characters']
  },
  accountType: {
    type: String,
    enum: ['Assets', 'Liabilities', 'Equity', 'Income', 'Expenses'],
    required: [true, 'Account type is required']
  },
  subType: {
    type: String,
    required: [true, 'Sub type is required'],
    enum: [
      // Assets
      'Current Assets', 'Fixed Assets', 'Investments', 'Other Assets',
      // Liabilities
      'Current Liabilities', 'Long Term Liabilities', 'Other Liabilities',
      // Equity
      'Owner Equity', 'Retained Earnings',
      // Income
      'Operating Revenue', 'Other Income',
      // Expenses
      'Cost of Goods Sold', 'Operating Expenses', 'Other Expenses'
    ]
  },
  parentAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccounts',
    default: null
  },
  level: {
    type: Number,
    default: 1,
    min: [1, 'Level must be at least 1'],
    max: [5, 'Level cannot be more than 5']
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  balanceType: {
    type: String,
    enum: ['Debit', 'Credit'],
    required: [true, 'Balance type is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSystemAccount: {
    type: Boolean,
    default: false
  },
  taxConfiguration: {
    isTaxable: {
      type: Boolean,
      default: false
    },
    defaultTax: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tax'
    }
  },
  reportingConfiguration: {
    showInBalanceSheet: {
      type: Boolean,
      default: true
    },
    showInProfitLoss: {
      type: Boolean,
      default: true
    },
    showInCashFlow: {
      type: Boolean,
      default: false
    }
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
chartOfAccountsSchema.index({ accountCode: 1 });
chartOfAccountsSchema.index({ accountName: 1 });
chartOfAccountsSchema.index({ accountType: 1 });
chartOfAccountsSchema.index({ subType: 1 });
chartOfAccountsSchema.index({ parentAccount: 1 });
chartOfAccountsSchema.index({ level: 1 });
chartOfAccountsSchema.index({ isActive: 1 });
chartOfAccountsSchema.index({ isGroup: 1 });

// Virtual for full account path
chartOfAccountsSchema.virtual('fullPath').get(function() {
  // This would need to be populated with parent account names
  return `${this.accountCode} - ${this.accountName}`;
});

// Virtual for balance status
chartOfAccountsSchema.virtual('balanceStatus').get(function() {
  if (this.currentBalance === 0) return 'Zero Balance';
  if (this.currentBalance > 0) return this.balanceType === 'Debit' ? 'Positive' : 'Negative';
  return this.balanceType === 'Debit' ? 'Negative' : 'Positive';
});

// Method to get account hierarchy
chartOfAccountsSchema.methods.getHierarchy = async function() {
  const hierarchy = [];
  let current = this;
  
  while (current.parentAccount) {
    current = await this.constructor.findById(current.parentAccount);
    if (current) {
      hierarchy.unshift({
        _id: current._id,
        accountCode: current.accountCode,
        accountName: current.accountName
      });
    }
  }
  
  return hierarchy;
};

// Method to update balance
chartOfAccountsSchema.methods.updateBalance = function(amount, isDebit = true) {
  if (this.balanceType === 'Debit') {
    this.currentBalance += isDebit ? amount : -amount;
  } else {
    this.currentBalance += isDebit ? -amount : amount;
  }
  return this.save();
};

// Pre-save middleware to set level based on parent
chartOfAccountsSchema.pre('save', async function(next) {
  if (this.parentAccount && this.isModified('parentAccount')) {
    try {
      const parent = await this.constructor.findById(this.parentAccount);
      if (parent) {
        this.level = parent.level + 1;
        this.accountType = parent.accountType;
        this.subType = parent.subType;
      }
    } catch (error) {
      return next(error);
    }
  }
  
  // Set opening balance as current balance for new accounts
  if (this.isNew && this.currentBalance === 0) {
    this.currentBalance = this.openingBalance;
  }
  
  next();
});

// Ensure virtual fields are serialized
chartOfAccountsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('ChartOfAccounts', chartOfAccountsSchema);
