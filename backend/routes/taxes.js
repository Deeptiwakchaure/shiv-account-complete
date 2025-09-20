const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorize } = require('../middleware/auth');
const Tax = require('../models/Tax');

const router = express.Router();

// Validation middleware
const validateTax = [
  body('name').trim().notEmpty().withMessage('Tax name is required'),
  body('type').isIn(['GST', 'IGST', 'CGST', 'SGST', 'UTGST', 'CESS', 'TDS', 'TCS', 'VAT', 'Service Tax']).withMessage('Invalid tax type'),
  body('rate').isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  body('applicableOn').optional().isIn(['Sales', 'Purchase', 'Both']).withMessage('Invalid applicableOn value'),
  body('effectiveFrom').optional().isISO8601().withMessage('effectiveFrom must be a valid date'),
  body('effectiveTo').optional().isISO8601().withMessage('effectiveTo must be a valid date'),
];

// GET /api/taxes - List taxes with pagination & search
router.get('/', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { page = 1, limit = 10, type, applicableOn, isActive, search } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (applicableOn) filter.applicableOn = applicableOn;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { hsnCodes: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }

    const taxes = await Tax.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Tax.countDocuments(filter);

    res.json({
      success: true,
      data: taxes,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching taxes', error: error.message });
  }
});

// GET /api/taxes/:id - Get a tax
router.get('/:id', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const tax = await Tax.findById(req.params.id);
    if (!tax) return res.status(404).json({ success: false, message: 'Tax not found' });
    res.json({ success: true, data: tax });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tax', error: error.message });
  }
});

// POST /api/taxes - Create a tax
router.post('/', authenticateToken, authorize('Admin'), validateTax, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const tax = new Tax({ ...req.body, createdBy: req.user.id });
    await tax.save();
    res.status(201).json({ success: true, message: 'Tax created successfully', data: tax });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating tax', error: error.message });
  }
});

// PUT /api/taxes/:id - Update a tax
router.put('/:id', authenticateToken, authorize('Admin'), validateTax, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const tax = await Tax.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tax) return res.status(404).json({ success: false, message: 'Tax not found' });
    res.json({ success: true, message: 'Tax updated successfully', data: tax });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating tax', error: error.message });
  }
});

// PATCH /api/taxes/:id/status - Toggle active status
router.patch('/:id/status', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const tax = await Tax.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!tax) return res.status(404).json({ success: false, message: 'Tax not found' });
    res.json({ success: true, message: 'Tax status updated', data: tax });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating status', error: error.message });
  }
});

// DELETE /api/taxes/:id - Soft delete
router.delete('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const tax = await Tax.findById(req.params.id);
    if (!tax) return res.status(404).json({ success: false, message: 'Tax not found' });
    tax.isActive = false;
    await tax.save();
    res.json({ success: true, message: 'Tax deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting tax', error: error.message });
  }
});

module.exports = router;
