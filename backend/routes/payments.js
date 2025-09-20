const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Contact = require('../models/Contact');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const PurchaseOrder = require('../models/PurchaseOrder');
const SalesOrder = require('../models/SalesOrder');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validatePayment = [
  body('type').isIn(['Payment', 'Receipt']).withMessage('Type must be Payment or Receipt'),
  body('contact').notEmpty().withMessage('Contact is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').isIn(['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card', 'Debit Card', 'Online']).withMessage('Invalid payment method'),
  body('paymentDate').isISO8601().withMessage('Valid payment date is required')
];

// Generate payment number
const generatePaymentNumber = async (type) => {
  const prefix = type === 'Payment' ? 'PAY' : 'REC';
  const count = await Payment.countDocuments({ type });
  return `${prefix}${String(count + 1).padStart(6, '0')}`;
};

// GET /api/payments - Get all payments
router.get('/', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type,
      contact,
      paymentMethod,
      status,
      startDate, 
      endDate,
      search 
    } = req.query;

    const filter = { isActive: true };
    
    if (type) filter.type = type;
    if (contact) filter.contact = contact;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (search) {
      filter.$or = [
        { paymentNumber: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await Payment.find(filter)
      .populate('contact', 'name email mobile type')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
});

// GET /api/payments/:id - Get single payment
router.get('/:id', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('contact')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
});

// POST /api/payments - Create new payment
router.post('/', authenticateToken, authorize('Admin', 'Accountant'), validatePayment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      type, 
      contact, 
      amount, 
      paymentDate, 
      paymentMethod, 
      bankAccount,
      chequeNumber,
      chequeDate,
      upiTransactionId,
      referenceNumber,
      description,
      linkedDocuments 
    } = req.body;

    // Verify contact exists
    const contactDoc = await Contact.findById(contact);
    if (!contactDoc) {
      return res.status(400).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Validate contact type based on payment type
    if (type === 'Payment' && !['Vendor', 'Both'].includes(contactDoc.type)) {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be made to vendors'
      });
    }

    if (type === 'Receipt' && !['Customer', 'Both'].includes(contactDoc.type)) {
      return res.status(400).json({
        success: false,
        message: 'Receipt can only be received from customers'
      });
    }

    // Validate linked documents if provided
    let processedLinkedDocuments = [];
    let totalAllocated = 0;

    if (linkedDocuments && linkedDocuments.length > 0) {
      for (const doc of linkedDocuments) {
        let documentExists = false;
        
        switch (doc.documentType) {
          case 'Invoice':
            documentExists = await Invoice.findById(doc.documentId);
            break;
          case 'Expense':
            documentExists = await Expense.findById(doc.documentId);
            break;
          case 'PurchaseOrder':
            documentExists = await PurchaseOrder.findById(doc.documentId);
            break;
          case 'SalesOrder':
            documentExists = await SalesOrder.findById(doc.documentId);
            break;
        }

        if (!documentExists) {
          return res.status(400).json({
            success: false,
            message: `${doc.documentType} not found: ${doc.documentId}`
          });
        }

        processedLinkedDocuments.push({
          documentType: doc.documentType,
          documentId: doc.documentId,
          documentNumber: doc.documentNumber,
          allocatedAmount: doc.allocatedAmount
        });

        totalAllocated += doc.allocatedAmount;
      }

      if (totalAllocated > amount) {
        return res.status(400).json({
          success: false,
          message: 'Total allocated amount cannot exceed payment amount'
        });
      }
    }

    const paymentNumber = await generatePaymentNumber(type);

    const payment = new Payment({
      paymentNumber,
      type,
      contact: contactDoc._id,
      contactName: contactDoc.name,
      amount,
      paymentDate,
      paymentMethod,
      bankAccount,
      chequeNumber,
      chequeDate,
      upiTransactionId,
      referenceNumber,
      description,
      linkedDocuments: processedLinkedDocuments,
      totalAllocated,
      unallocatedAmount: amount - totalAllocated,
      createdBy: req.user.id
    });

    await payment.save();

    // Update linked documents with payment information
    for (const doc of processedLinkedDocuments) {
      let document;
      switch (doc.documentType) {
        case 'Invoice':
          document = await Invoice.findById(doc.documentId);
          if (document) {
            document.paidAmount += doc.allocatedAmount;
            document.balanceAmount = document.totalAmount - document.paidAmount;
            if (document.balanceAmount <= 0) {
              document.status = 'Paid';
            }
            await document.save();
          }
          break;
        case 'Expense':
          document = await Expense.findById(doc.documentId);
          if (document) {
            document.paidAmount += doc.allocatedAmount;
            document.balanceAmount = document.totalAmount - document.paidAmount;
            if (document.balanceAmount <= 0) {
              document.status = 'Paid';
            }
            await document.save();
          }
          break;
      }
    }

    // Update contact balance
    if (type === 'Payment') {
      contactDoc.currentBalance -= amount;
    } else {
      contactDoc.currentBalance += amount;
    }
    await contactDoc.save();

    // Populate the response
    await payment.populate('contact', 'name email mobile type');
    await payment.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment',
      error: error.message
    });
  }
});

// PUT /api/payments/:id - Update payment
router.put('/:id', authenticateToken, authorize('Admin', 'Accountant'), validatePayment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if payment can be modified
    if (payment.status === 'Cleared') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify cleared payment'
      });
    }

    const { 
      type, 
      contact, 
      amount, 
      paymentDate, 
      paymentMethod, 
      bankAccount,
      chequeNumber,
      chequeDate,
      upiTransactionId,
      referenceNumber,
      description,
      linkedDocuments 
    } = req.body;

    // Verify contact exists
    const contactDoc = await Contact.findById(contact);
    if (!contactDoc) {
      return res.status(400).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Revert previous contact balance changes
    const oldContactDoc = await Contact.findById(payment.contact);
    if (oldContactDoc) {
      if (payment.type === 'Payment') {
        oldContactDoc.currentBalance += payment.amount;
      } else {
        oldContactDoc.currentBalance -= payment.amount;
      }
      await oldContactDoc.save();
    }

    // Revert previous document allocations
    for (const doc of payment.linkedDocuments) {
      let document;
      switch (doc.documentType) {
        case 'Invoice':
          document = await Invoice.findById(doc.documentId);
          if (document) {
            document.paidAmount -= doc.allocatedAmount;
            document.balanceAmount = document.totalAmount - document.paidAmount;
            await document.save();
          }
          break;
        case 'Expense':
          document = await Expense.findById(doc.documentId);
          if (document) {
            document.paidAmount -= doc.allocatedAmount;
            document.balanceAmount = document.totalAmount - document.paidAmount;
            await document.save();
          }
          break;
      }
    }

    // Process new linked documents
    let processedLinkedDocuments = [];
    let totalAllocated = 0;

    if (linkedDocuments && linkedDocuments.length > 0) {
      for (const doc of linkedDocuments) {
        processedLinkedDocuments.push({
          documentType: doc.documentType,
          documentId: doc.documentId,
          documentNumber: doc.documentNumber,
          allocatedAmount: doc.allocatedAmount
        });
        totalAllocated += doc.allocatedAmount;
      }
    }

    // Update payment
    Object.assign(payment, {
      type,
      contact: contactDoc._id,
      contactName: contactDoc.name,
      amount,
      paymentDate,
      paymentMethod,
      bankAccount,
      chequeNumber,
      chequeDate,
      upiTransactionId,
      referenceNumber,
      description,
      linkedDocuments: processedLinkedDocuments,
      totalAllocated,
      unallocatedAmount: amount - totalAllocated
    });

    await payment.save();

    // Apply new document allocations
    for (const doc of processedLinkedDocuments) {
      let document;
      switch (doc.documentType) {
        case 'Invoice':
          document = await Invoice.findById(doc.documentId);
          if (document) {
            document.paidAmount += doc.allocatedAmount;
            document.balanceAmount = document.totalAmount - document.paidAmount;
            if (document.balanceAmount <= 0) {
              document.status = 'Paid';
            }
            await document.save();
          }
          break;
        case 'Expense':
          document = await Expense.findById(doc.documentId);
          if (document) {
            document.paidAmount += doc.allocatedAmount;
            document.balanceAmount = document.totalAmount - document.paidAmount;
            if (document.balanceAmount <= 0) {
              document.status = 'Paid';
            }
            await document.save();
          }
          break;
      }
    }

    // Update new contact balance
    if (type === 'Payment') {
      contactDoc.currentBalance -= amount;
    } else {
      contactDoc.currentBalance += amount;
    }
    await contactDoc.save();

    // Populate the response
    await payment.populate('contact', 'name email mobile type');
    await payment.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment',
      error: error.message
    });
  }
});

// PUT /api/payments/:id/status - Update payment status
router.put('/:id/status', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { status } = req.body;
    
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const validStatuses = ['Pending', 'Cleared', 'Bounced', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    payment.status = status;

    if (status === 'Cleared') {
      payment.approvedBy = req.user.id;
      payment.approvedAt = new Date();
    }

    await payment.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
});

// DELETE /api/payments/:id - Delete payment (soft delete)
router.delete('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if payment can be deleted
    if (payment.status === 'Cleared') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete cleared payment'
      });
    }

    // Revert contact balance changes
    const contactDoc = await Contact.findById(payment.contact);
    if (contactDoc) {
      if (payment.type === 'Payment') {
        contactDoc.currentBalance += payment.amount;
      } else {
        contactDoc.currentBalance -= payment.amount;
      }
      await contactDoc.save();
    }

    // Revert document allocations
    for (const doc of payment.linkedDocuments) {
      let document;
      switch (doc.documentType) {
        case 'Invoice':
          document = await Invoice.findById(doc.documentId);
          if (document) {
            document.paidAmount -= doc.allocatedAmount;
            document.balanceAmount = document.totalAmount - document.paidAmount;
            await document.save();
          }
          break;
        case 'Expense':
          document = await Expense.findById(doc.documentId);
          if (document) {
            document.paidAmount -= doc.allocatedAmount;
            document.balanceAmount = document.totalAmount - document.paidAmount;
            await document.save();
          }
          break;
      }
    }

    payment.isActive = false;
    await payment.save();

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting payment',
      error: error.message
    });
  }
});

// GET /api/payments/stats/summary - Get payment statistics
router.get('/stats/summary', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            type: '$type',
            status: '$status'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const methodStats = await Payment.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const summary = {
      total: 0,
      totalAmount: 0,
      payments: { total: 0, amount: 0 },
      receipts: { total: 0, amount: 0 },
      byStatus: {},
      byMethod: {}
    };

    stats.forEach(stat => {
      summary.total += stat.count;
      summary.totalAmount += stat.totalAmount;
      
      if (stat._id.type === 'Payment') {
        summary.payments.total += stat.count;
        summary.payments.amount += stat.totalAmount;
      } else {
        summary.receipts.total += stat.count;
        summary.receipts.amount += stat.totalAmount;
      }

      const key = `${stat._id.type}_${stat._id.status}`;
      summary.byStatus[key] = {
        count: stat.count,
        amount: stat.totalAmount
      };
    });

    methodStats.forEach(stat => {
      summary.byMethod[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount
      };
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statistics',
      error: error.message
    });
  }
});

// GET /api/payments/outstanding/:contactId - Get outstanding amounts for a contact
router.get('/outstanding/:contactId', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    let outstandingDocuments = [];

    if (['Customer', 'Both'].includes(contact.type)) {
      // Get outstanding invoices
      const invoices = await Invoice.find({
        customer: contact._id,
        balanceAmount: { $gt: 0 },
        status: { $nin: ['Paid', 'Cancelled'] },
        isActive: true
      }).select('invoiceNumber invoiceDate totalAmount paidAmount balanceAmount dueDate');

      outstandingDocuments = outstandingDocuments.concat(
        invoices.map(inv => ({
          documentType: 'Invoice',
          documentId: inv._id,
          documentNumber: inv.invoiceNumber,
          documentDate: inv.invoiceDate,
          totalAmount: inv.totalAmount,
          paidAmount: inv.paidAmount,
          balanceAmount: inv.balanceAmount,
          dueDate: inv.dueDate
        }))
      );
    }

    if (['Vendor', 'Both'].includes(contact.type)) {
      // Get outstanding expenses
      const expenses = await Expense.find({
        vendor: contact._id,
        balanceAmount: { $gt: 0 },
        status: { $nin: ['Paid', 'Cancelled'] },
        isActive: true
      }).select('billNumber billDate totalAmount paidAmount balanceAmount dueDate');

      outstandingDocuments = outstandingDocuments.concat(
        expenses.map(exp => ({
          documentType: 'Expense',
          documentId: exp._id,
          documentNumber: exp.billNumber,
          documentDate: exp.billDate,
          totalAmount: exp.totalAmount,
          paidAmount: exp.paidAmount,
          balanceAmount: exp.balanceAmount,
          dueDate: exp.dueDate
        }))
      );
    }

    res.json({
      success: true,
      data: {
        contact: {
          _id: contact._id,
          name: contact.name,
          type: contact.type,
          currentBalance: contact.currentBalance
        },
        outstandingDocuments
      }
    });
  } catch (error) {
    console.error('Error fetching outstanding amounts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching outstanding amounts',
      error: error.message
    });
  }
});

module.exports = router;
