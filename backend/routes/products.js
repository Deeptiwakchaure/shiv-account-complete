const express = require('express');
const { body } = require('express-validator');
const Product = require('../models/Product');
const { authenticateToken, authorize } = require('../middleware/auth');
const { handleValidationErrors, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with pagination and search
// @access  Private
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { search, type, category, status = 'active' } = req.query;
    const { page, limit, skip } = req.pagination;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { hsnCode: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type && type !== 'All') {
      query.type = type;
    }
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Get products with pagination
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(query);

    // Get unique categories for filter
    const categories = await Product.distinct('category', { isActive: true });

    res.json({
      success: true,
      data: {
        products,
        categories,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: error.message
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Private
router.get('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product',
      error: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin, Accountant)
router.post('/', [
  authenticateToken,
  authorize('Admin', 'Accountant'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('type')
    .isIn(['Goods', 'Service'])
    .withMessage('Type must be Goods or Service'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  body('hsnCode')
    .matches(/^\d{4,8}$/)
    .withMessage('HSN code must be 4-8 digits'),
  body('unit')
    .isIn(['PCS', 'KG', 'LTR', 'MTR', 'SFT', 'CBM', 'BOX', 'SET', 'PAIR', 'DOZEN', 'HOUR', 'DAY', 'MONTH', 'YEAR'])
    .withMessage('Invalid unit'),
  body('salesPrice')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Sales price must be a positive number'),
  body('purchasePrice')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),
  body('salesTaxPercent')
    .optional()
    .isNumeric()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Sales tax percentage must be between 0 and 100'),
  body('purchaseTaxPercent')
    .optional()
    .isNumeric()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Purchase tax percentage must be between 0 and 100')
], handleValidationErrors, async (req, res) => {
  try {
    const productData = req.body;

    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ 
      name: productData.name,
      isActive: true 
    });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    // Set current stock same as opening stock
    productData.currentStock = productData.openingStock || 0;

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin, Accountant)
router.put('/:id', [
  authenticateToken,
  authorize('Admin', 'Accountant'),
  validateObjectId(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('type')
    .optional()
    .isIn(['Goods', 'Service'])
    .withMessage('Type must be Goods or Service'),
  body('hsnCode')
    .optional()
    .matches(/^\d{4,8}$/)
    .withMessage('HSN code must be 4-8 digits'),
  body('salesPrice')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Sales price must be a positive number'),
  body('purchasePrice')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number')
], handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if name is being changed and if it already exists
    if (req.body.name && req.body.name !== product.name) {
      const existingProduct = await Product.findOne({ 
        name: req.body.name,
        isActive: true,
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this name already exists'
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private (Admin only)
router.delete('/:id', [
  authenticateToken,
  authorize('Admin'),
  validateObjectId()
], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

// @route   GET /api/products/stock/low
// @desc    Get products with low stock
// @access  Private
router.get('/stock/low', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: {
        $lte: ['$currentStock', '$minimumStock']
      }
    }).sort({ currentStock: 1 });

    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve low stock products',
      error: error.message
    });
  }
});

module.exports = router;
