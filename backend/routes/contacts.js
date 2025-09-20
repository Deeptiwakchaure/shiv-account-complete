const express = require('express');
const { body } = require('express-validator');
const Contact = require('../models/Contact');
const { authenticateToken, authorize } = require('../middleware/auth');
const { handleValidationErrors, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/contacts
// @desc    Get all contacts with pagination and search
// @access  Private
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { search, type, status = 'active' } = req.query;
    const { page, limit, skip } = req.pagination;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type && type !== 'All') {
      query.type = type;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Get contacts with pagination
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contacts',
      error: error.message
    });
  }
});

// @route   GET /api/contacts/:id
// @desc    Get single contact by ID
// @access  Private
router.get('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: { contact }
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact',
      error: error.message
    });
  }
});

// @route   POST /api/contacts
// @desc    Create new contact
// @access  Private (Admin, Accountant)
router.post('/', [
  authenticateToken,
  authorize('Admin', 'Accountant'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('type')
    .isIn(['Customer', 'Vendor', 'Both'])
    .withMessage('Type must be Customer, Vendor, or Both'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('mobile')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid mobile number'),
  body('gstNumber')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please provide a valid GST number'),
  body('panNumber')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Please provide a valid PAN number'),
  body('openingBalance')
    .optional()
    .isNumeric()
    .withMessage('Opening balance must be a number')
], handleValidationErrors, async (req, res) => {
  try {
    const contactData = req.body;

    // Check if contact with email already exists
    const existingContact = await Contact.findOne({ email: contactData.email });
    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact with this email already exists'
      });
    }

    // Set current balance same as opening balance
    contactData.currentBalance = contactData.openingBalance || 0;

    const contact = new Contact(contactData);
    await contact.save();

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: { contact }
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact',
      error: error.message
    });
  }
});

// @route   PUT /api/contacts/:id
// @desc    Update contact
// @access  Private (Admin, Accountant)
router.put('/:id', [
  authenticateToken,
  authorize('Admin', 'Accountant'),
  validateObjectId(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('type')
    .optional()
    .isIn(['Customer', 'Vendor', 'Both'])
    .withMessage('Type must be Customer, Vendor, or Both'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('mobile')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid mobile number')
], handleValidationErrors, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (req.body.email && req.body.email !== contact.email) {
      const existingContact = await Contact.findOne({ email: req.body.email });
      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: 'Contact with this email already exists'
        });
      }
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: { contact: updatedContact }
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact',
      error: error.message
    });
  }
});

// @route   DELETE /api/contacts/:id
// @desc    Delete contact (soft delete)
// @access  Private (Admin only)
router.delete('/:id', [
  authenticateToken,
  authorize('Admin'),
  validateObjectId()
], async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Soft delete by setting isActive to false
    contact.isActive = false;
    await contact.save();

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message
    });
  }
});

// @route   GET /api/contacts/type/:type
// @desc    Get contacts by type
// @access  Private
router.get('/type/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { search } = req.query;

    if (!['Customer', 'Vendor', 'Both'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact type'
      });
    }

    let query = { type, isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(query)
      .select('name email mobile type currentBalance')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: { contacts }
    });
  } catch (error) {
    console.error('Get contacts by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contacts',
      error: error.message
    });
  }
});

module.exports = router;
