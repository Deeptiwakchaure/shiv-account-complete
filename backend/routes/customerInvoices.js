const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorize } = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Contact = require('../models/Contact');
const Product = require('../models/Product');

const router = express.Router();

// Validation middleware
const validateInvoice = [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('dueDate').isISO8601().withMessage('Due date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').notEmpty().withMessage('Product is required for each item'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price cannot be negative')
];

// Generate invoice number
const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  return `INV${String(count + 1).padStart(6, '0')}`;
};

// GET /api/customer-invoices - list invoices
router.get('/', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer, startDate, endDate, search } = req.query;
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    if (startDate && endDate) {
      filter.invoiceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate('customer', 'name email mobile')
      .populate('items.product', 'name hsnCode unit')
      .populate('createdBy', 'name email')
      .sort({ invoiceDate: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({ success: true, data: invoices, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching invoices', error: error.message });
  }
});

// GET /api/customer-invoices/:id
router.get('/:id', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('items.product')
      .populate('createdBy', 'name email');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching invoice', error: error.message });
  }
});

// POST /api/customer-invoices
router.post('/', authenticateToken, authorize('Admin', 'Accountant'), validateInvoice, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { customer, items, dueDate, paymentTerms, notes, discountAmount = 0 } = req.body;
    const customerDoc = await Contact.findById(customer);
    if (!customerDoc || !['Customer', 'Both'].includes(customerDoc.type)) {
      return res.status(400).json({ success: false, message: 'Invalid customer' });
    }

    // Build items
    const processed = [];
    let subtotal = 0;
    let taxAmount = 0;
    for (const it of items) {
      const product = await Product.findById(it.product);
      if (!product) return res.status(400).json({ success: false, message: `Product not found: ${it.product}` });
      const line = it.quantity * it.unitPrice;
      const tax = (line * (it.taxPercent || 0)) / 100;
      processed.push({
        product: product._id,
        productName: product.name,
        hsnCode: product.hsnCode,
        quantity: it.quantity,
        unit: product.unit,
        unitPrice: it.unitPrice,
        taxPercent: it.taxPercent || 0,
        taxAmount: tax,
        totalAmount: line + tax
      });
      subtotal += line;
      taxAmount += tax;
    }

    const invoiceNumber = await generateInvoiceNumber();
    const totalAmount = subtotal + taxAmount - discountAmount;

    const invoice = new Invoice({
      invoiceNumber,
      customer: customerDoc._id,
      customerName: customerDoc.name,
      customerEmail: customerDoc.email,
      customerAddress: customerDoc.address,
      customerGST: customerDoc.gstNumber,
      items: processed,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      dueDate,
      paymentTerms: paymentTerms || 'Due on receipt',
      status: 'Sent',
      createdBy: req.user.id
    });

    await invoice.save();
    await invoice.populate('customer', 'name email mobile');
    await invoice.populate('items.product', 'name hsnCode unit');

    res.status(201).json({ success: true, message: 'Invoice created successfully', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating invoice', error: error.message });
  }
});

// PUT /api/customer-invoices/:id
router.put('/:id', authenticateToken, authorize('Admin', 'Accountant'), validateInvoice, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (['Paid', 'Cancelled'].includes(invoice.status)) {
      return res.status(400).json({ success: false, message: 'Cannot modify paid or cancelled invoices' });
    }

    const { customer, items, dueDate, paymentTerms, notes, discountAmount = 0 } = req.body;
    const customerDoc = await Contact.findById(customer);
    if (!customerDoc || !['Customer', 'Both'].includes(customerDoc.type)) {
      return res.status(400).json({ success: false, message: 'Invalid customer' });
    }

    // Recalculate lines
    const processed = [];
    let subtotal = 0, taxAmount = 0;
    for (const it of items) {
      const product = await Product.findById(it.product);
      if (!product) return res.status(400).json({ success: false, message: `Product not found: ${it.product}` });
      const line = it.quantity * it.unitPrice;
      const tax = (line * (it.taxPercent || 0)) / 100;
      processed.push({
        product: product._id,
        productName: product.name,
        hsnCode: product.hsnCode,
        quantity: it.quantity,
        unit: product.unit,
        unitPrice: it.unitPrice,
        taxPercent: it.taxPercent || 0,
        taxAmount: tax,
        totalAmount: line + tax
      });
      subtotal += line;
      taxAmount += tax;
    }

    const totalAmount = subtotal + taxAmount - discountAmount;

    Object.assign(invoice, {
      customer: customerDoc._id,
      customerName: customerDoc.name,
      customerEmail: customerDoc.email,
      customerAddress: customerDoc.address,
      customerGST: customerDoc.gstNumber,
      items: processed,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      balanceAmount: totalAmount - invoice.paidAmount,
      dueDate,
      paymentTerms: paymentTerms || invoice.paymentTerms,
      notes
    });

    await invoice.save();
    await invoice.populate('customer', 'name email mobile');
    await invoice.populate('items.product', 'name hsnCode unit');

    res.json({ success: true, message: 'Invoice updated successfully', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating invoice', error: error.message });
  }
});

// PUT /api/customer-invoices/:id/status
router.put('/:id/status', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    invoice.status = status;
    await invoice.save();
    res.json({ success: true, message: 'Status updated', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating status', error: error.message });
  }
});

// DELETE /api/customer-invoices/:id (soft)
router.delete('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    invoice.isActive = false;
    await invoice.save();
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting invoice', error: error.message });
  }
});

// GET /api/customer-invoices/stats/summary
router.get('/stats/summary', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
    ]);

    const summary = { total: 0, totalAmount: 0, byStatus: {} };
    stats.forEach(s => {
      summary.total += s.count;
      summary.totalAmount += s.totalAmount;
      summary.byStatus[s._id] = { count: s.count, amount: s.totalAmount };
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
});

module.exports = router;
