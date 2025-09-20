const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorize } = require('../middleware/auth');
const ChartOfAccounts = require('../models/ChartOfAccounts');

const router = express.Router();

// Validation middleware
const validateAccount = [
  body('accountCode').trim().notEmpty().withMessage('Account code is required'),
  body('accountName').trim().notEmpty().withMessage('Account name is required'),
  body('accountType').isIn(['Assets', 'Liabilities', 'Equity', 'Income', 'Expenses']).withMessage('Invalid account type'),
  body('subType').trim().notEmpty().withMessage('Sub type is required'),
  body('balanceType').isIn(['Debit', 'Credit']).withMessage('Invalid balance type'),
];

// GET /api/accounts - List with pagination and search
router.get('/', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { page = 1, limit = 20, accountType, subType, parentAccount, search } = req.query;
    const filter = {};
    if (accountType) filter.accountType = accountType;
    if (subType) filter.subType = subType;
    if (parentAccount) filter.parentAccount = parentAccount;
    if (search) {
      filter.$or = [
        { accountCode: { $regex: search, $options: 'i' } },
        { accountName: { $regex: search, $options: 'i' } }
      ];
    }

    const accounts = await ChartOfAccounts.find(filter)
      .sort({ accountCode: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    const total = await ChartOfAccounts.countDocuments(filter);

    res.json({
      success: true,
      data: accounts,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching accounts', error: error.message });
  }
});

// GET /api/accounts/tree - Tree view
router.get('/tree', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const accounts = await ChartOfAccounts.find({}).lean();
    const byId = Object.fromEntries(accounts.map(a => [a._id.toString(), { ...a, children: [] }]));
    const roots = [];
    for (const acc of Object.values(byId)) {
      if (acc.parentAccount) {
        const parent = byId[acc.parentAccount.toString()];
        if (parent) parent.children.push(acc);
      } else {
        roots.push(acc);
      }
    }
    res.json({ success: true, data: roots });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error building tree', error: error.message });
  }
});

// GET /api/accounts/:id
router.get('/:id', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const acc = await ChartOfAccounts.findById(req.params.id);
    if (!acc) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, data: acc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching account', error: error.message });
  }
});

// POST /api/accounts
router.post('/', authenticateToken, authorize('Admin'), validateAccount, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    const exists = await ChartOfAccounts.findOne({ accountCode: req.body.accountCode });
    if (exists) return res.status(400).json({ success: false, message: 'Account code already exists' });
    const acc = new ChartOfAccounts({ ...req.body, createdBy: req.user.id });
    await acc.save();
    res.status(201).json({ success: true, message: 'Account created successfully', data: acc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating account', error: error.message });
  }
});

// PUT /api/accounts/:id
router.put('/:id', authenticateToken, authorize('Admin'), validateAccount, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    const acc = await ChartOfAccounts.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!acc) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, message: 'Account updated successfully', data: acc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating account', error: error.message });
  }
});

// PATCH /api/accounts/:id/balance - Adjust balance
router.patch('/:id/balance', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { amount, isDebit } = req.body;
    const acc = await ChartOfAccounts.findById(req.params.id);
    if (!acc) return res.status(404).json({ success: false, message: 'Account not found' });
    await acc.updateBalance(Number(amount || 0), Boolean(isDebit));
    res.json({ success: true, message: 'Balance updated', data: acc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating balance', error: error.message });
  }
});

// DELETE /api/accounts/:id - Soft delete by setting isActive=false
router.delete('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const acc = await ChartOfAccounts.findById(req.params.id);
    if (!acc) return res.status(404).json({ success: false, message: 'Account not found' });
    acc.isActive = false;
    await acc.save();
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting account', error: error.message });
  }
});

module.exports = router;
