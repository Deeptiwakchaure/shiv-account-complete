const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorize } = require('../middleware/auth');
const Expense = require('../models/Expense');
const Contact = require('../models/Contact');
const Product = require('../models/Product');

const router = express.Router();

// Validation middleware
const validateBill = [
  body('vendor').notEmpty().withMessage('Vendor is required'),
  body('dueDate').isISO8601().withMessage('Due date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').notEmpty().withMessage('Product is required for each item'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price cannot be negative')
];

// Generate bill number
const generateBillNumber = async () => {
  const count = await Expense.countDocuments();
  return `BILL${String(count + 1).padStart(6, '0')}`;
};

// GET /api/vendor-bills - list bills
router.get('/', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, vendor, startDate, endDate, search } = req.query;
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (vendor) filter.vendor = vendor;
    if (startDate && endDate) filter.billDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } }
      ];
    }

    const bills = await Expense.find(filter)
      .populate('vendor', 'name email mobile')
      .populate('items.product', 'name hsnCode unit')
      .populate('createdBy', 'name email')
      .sort({ billDate: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Expense.countDocuments(filter);

    res.json({ success: true, data: bills, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bills', error: error.message });
  }
});

// GET /api/vendor-bills/:id
router.get('/:id', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const bill = await Expense.findById(req.params.id)
      .populate('vendor')
      .populate('items.product')
      .populate('createdBy', 'name email');
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bill', error: error.message });
  }
});

// POST /api/vendor-bills
router.post('/', authenticateToken, authorize('Admin', 'Accountant'), validateBill, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { vendor, items, dueDate, paymentTerms, notes, discountAmount = 0 } = req.body;
    const vendorDoc = await Contact.findById(vendor);
    if (!vendorDoc || !['Vendor', 'Both'].includes(vendorDoc.type)) {
      return res.status(400).json({ success: false, message: 'Invalid vendor' });
    }

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

    const billNumber = await generateBillNumber();
    const totalAmount = subtotal + taxAmount - discountAmount;

    const bill = new Expense({
      billNumber,
      vendor: vendorDoc._id,
      vendorName: vendorDoc.name,
      vendorEmail: vendorDoc.email,
      vendorAddress: vendorDoc.address,
      vendorGST: vendorDoc.gstNumber,
      items: processed,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      dueDate,
      paymentTerms: paymentTerms || 'Due on receipt',
      status: 'Approved',
      createdBy: req.user.id
    });

    await bill.save();
    await bill.populate('vendor', 'name email mobile');
    await bill.populate('items.product', 'name hsnCode unit');

    res.status(201).json({ success: true, message: 'Vendor bill created successfully', data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating bill', error: error.message });
  }
});

// PUT /api/vendor-bills/:id
router.put('/:id', authenticateToken, authorize('Admin', 'Accountant'), validateBill, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const bill = await Expense.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (['Paid', 'Cancelled'].includes(bill.status)) {
      return res.status(400).json({ success: false, message: 'Cannot modify paid or cancelled bills' });
    }

    const { vendor, items, dueDate, paymentTerms, notes, discountAmount = 0 } = req.body;
    const vendorDoc = await Contact.findById(vendor);
    if (!vendorDoc || !['Vendor', 'Both'].includes(vendorDoc.type)) {
      return res.status(400).json({ success: false, message: 'Invalid vendor' });
    }

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

    Object.assign(bill, {
      vendor: vendorDoc._id,
      vendorName: vendorDoc.name,
      vendorEmail: vendorDoc.email,
      vendorAddress: vendorDoc.address,
      vendorGST: vendorDoc.gstNumber,
      items: processed,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      balanceAmount: totalAmount - bill.paidAmount,
      dueDate,
      paymentTerms: paymentTerms || bill.paymentTerms,
      notes
    });

    await bill.save();
    await bill.populate('vendor', 'name email mobile');
    await bill.populate('items.product', 'name hsnCode unit');

    res.json({ success: true, message: 'Vendor bill updated successfully', data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating bill', error: error.message });
  }
});

// PUT /api/vendor-bills/:id/status
router.put('/:id/status', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Draft', 'Approved', 'Paid', 'Overdue', 'Cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const bill = await Expense.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    bill.status = status;
    await bill.save();
    res.json({ success: true, message: 'Status updated', data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating status', error: error.message });
  }
});

// DELETE /api/vendor-bills/:id (soft)
router.delete('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const bill = await Expense.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    bill.isActive = false;
    await bill.save();
    res.json({ success: true, message: 'Vendor bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting bill', error: error.message });
  }
});

// GET /api/vendor-bills/stats/summary
router.get('/stats/summary', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const stats = await Expense.aggregate([
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
