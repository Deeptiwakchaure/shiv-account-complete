const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 
      'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'SEND',
      'PAYMENT_RECEIVED', 'PAYMENT_MADE', 'INVOICE_GENERATED',
      'REPORT_GENERATED', 'BACKUP_CREATED', 'SETTINGS_CHANGED'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: [
      'User', 'Contact', 'Product', 'Invoice', 'Payment', 
      'SalesOrder', 'PurchaseOrder', 'Expense', 'Tax',
      'ChartOfAccounts', 'Report', 'Settings', 'System'
    ]
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  entityName: {
    type: String
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  sessionId: {
    type: String
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  isSuccessful: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ entityId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ isSuccessful: 1 });
auditLogSchema.index({ ipAddress: 1 });

// Compound indexes for common queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// Static method to log activity
auditLogSchema.statics.logActivity = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to prevent breaking main functionality
    return null;
  }
};

// Method to get formatted log entry
auditLogSchema.methods.getFormattedEntry = function() {
  return {
    timestamp: this.createdAt,
    user: this.userName,
    action: this.action,
    entity: `${this.entityType}${this.entityName ? ` (${this.entityName})` : ''}`,
    description: this.description,
    severity: this.severity,
    success: this.isSuccessful
  };
};

module.exports = mongoose.model('AuditLog', auditLogSchema);