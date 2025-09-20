const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorize } = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/inventory - list inventory with filters
router.get('/', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { page = 1, limit = 20, stockStatus, search } = req.query;

    const filter = {};
    if (stockStatus) {
      // We'll compute status on the fly after fetch; here we can skip filtering
    }
    if (search) {
      const products = await Product.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { hsnCode: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      filter.product = { $in: products.map(p => p._id) };
    }

    const items = await Inventory.find(filter)
      .populate('product', 'name hsnCode unit category')
      .sort({ updatedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    let data = items.map(doc => doc.toJSON());
    if (stockStatus) {
      data = data.filter(i => i.stockStatus === stockStatus);
    }

    const total = await Inventory.countDocuments(filter);

    res.json({
      success: true,
      data,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching inventory', error: error.message });
  }
});

// GET /api/inventory/:productId - get inventory for a product
router.get('/:productId', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const inv = await Inventory.findOne({ product: req.params.productId })
      .populate('product', 'name hsnCode unit category');
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found for product' });
    res.json({ success: true, data: inv });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching inventory', error: error.message });
  }
});

// POST /api/inventory/:productId/adjust - manual adjustment
router.post(
  '/:productId/adjust',
  authenticateToken,
  authorize('Admin', 'Accountant'),
  [
    body('transactionType').isIn(['Adjustment', 'Opening', 'Damage', 'Return']).withMessage('Invalid transaction type'),
    body('quantity').isFloat().withMessage('Quantity is required'),
    body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be >= 0'),
    body('notes').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const { transactionType, quantity, unitPrice, notes } = req.body;

      let inv = await Inventory.findOne({ product: req.params.productId });
      if (!inv) {
        inv = new Inventory({ product: req.params.productId });
      }

      await inv.addTransaction({
        transactionType,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        totalValue: Number(quantity) * Number(unitPrice),
        notes,
        createdBy: req.user.id
      });

      await inv.populate('product', 'name hsnCode unit category');

      res.status(201).json({ success: true, message: 'Inventory adjusted', data: inv });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error adjusting inventory', error: error.message });
    }
  }
);

// GET /api/inventory/:productId/transactions - list recent transactions
router.get('/:productId/transactions', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const inv = await Inventory.findOne({ product: req.params.productId })
      .select('transactions')
      .populate('transactions.createdBy', 'name email');
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found for product' });
    const tx = [...inv.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, Number(limit));
    res.json({ success: true, data: tx });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching transactions', error: error.message });
  }
});

module.exports = router;
