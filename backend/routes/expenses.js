const express = require('express');
const Expense = require('../models/Expense');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/expenses
// @desc    Get all expenses with filtering and pagination
// @access  Private (Admin, Accountant)
router.get('/', authenticateToken, authorize('Admin', 'Accountant'), validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      category,
      paymentMethod,
      vendorId,
      startDate,
      endDate
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { expenseNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (vendorId) filter.vendor = vendorId;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('vendor', 'name email')
      .populate('account', 'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(filter);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses',
      error: error.message
    });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private (Admin, Accountant)
router.post('/', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const {
      date,
      category,
      description,
      amount,
      paymentMethod,
      vendorId,
      accountId,
      notes,
      receipt
    } = req.body;

    // Generate expense number
    const count = await Expense.countDocuments();
    const expenseNumber = `EXP-${String(count + 1).padStart(4, '0')}`;

    const expense = new Expense({
      expenseNumber,
      date: new Date(date),
      category,
      description,
      amount: parseFloat(amount),
      paymentMethod,
      vendor: vendorId || undefined,
      account: accountId,
      notes,
      receipt,
      status: 'Draft',
      createdBy: req.user._id
    });

    await expense.save();
    await expense.populate('vendor', 'name email');
    await expense.populate('account', 'name type');

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense created successfully'
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating expense',
      error: error.message
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private (Admin, Accountant)
router.put('/:id', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    
    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }

    updateData.updatedAt = new Date();

    const expense = await Expense.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('vendor', 'name email')
      .populate('account', 'name type');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating expense',
      error: error.message
    });
  }
});

// @route   PUT /api/expenses/:id/status
// @desc    Update expense status
// @access  Private (Admin, Accountant)
router.put('/:id/status', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Draft', 'Approved', 'Paid'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Draft, Approved, or Paid'
      });
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('vendor', 'name email')
      .populate('account', 'name type');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: expense,
      message: `Expense ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error('Update expense status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating expense status',
      error: error.message
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private (Admin, Accountant)
router.delete('/:id', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if expense is paid - prevent deletion
    if (expense.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid expenses'
      });
    }

    await Expense.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense',
      error: error.message
    });
  }
});

// @route   GET /api/expenses/stats/summary
// @desc    Get expense statistics
// @access  Private (Admin, Accountant)
router.get('/stats/summary', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Total expenses
    const totalExpenses = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // This month expenses
    const thisMonthExpenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: currentMonth, $lt: nextMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Expenses by status
    const expensesByStatus = await Expense.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Expenses by category
    const expensesByCategory = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalExpenses: totalExpenses[0]?.total || 0,
        thisMonthExpenses: thisMonthExpenses[0]?.total || 0,
        expensesByStatus,
        expensesByCategory
      }
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense statistics',
      error: error.message
    });
  }
});

module.exports = router;