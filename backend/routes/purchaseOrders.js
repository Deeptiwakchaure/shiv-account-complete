const express = require('express');
const { body, validationResult } = require('express-validator');
const PurchaseOrder = require('../models/PurchaseOrder');
const Contact = require('../models/Contact');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validatePurchaseOrder = [
  body('vendor').notEmpty().withMessage('Vendor is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').notEmpty().withMessage('Product is required for each item'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
  body('expectedDeliveryDate').isISO8601().withMessage('Valid expected delivery date is required'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required')
];

// Generate purchase order number
const generateOrderNumber = async () => {
  const count = await PurchaseOrder.countDocuments();
  return `PO${String(count + 1).padStart(6, '0')}`;
};

// GET /api/purchase-orders - Get all purchase orders
router.get('/', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      vendor, 
      startDate, 
      endDate,
      search 
    } = req.query;

    const filter = { isActive: true };
    
    if (status) filter.status = status;
    if (vendor) filter.vendor = vendor;
    if (startDate && endDate) {
      filter.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } }
      ];
    }

    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('vendor', 'name email mobile')
      .populate('items.product', 'name hsnCode unit')
      .populate('createdBy', 'name email')
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PurchaseOrder.countDocuments(filter);

    res.json({
      success: true,
      data: purchaseOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase orders',
      error: error.message
    });
  }
});

// GET /api/purchase-orders/:id - Get single purchase order
router.get('/:id', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('vendor')
      .populate('items.product')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase order',
      error: error.message
    });
  }
});

// POST /api/purchase-orders - Create new purchase order
router.post('/', authenticateToken, authorize('Admin', 'Accountant'), validatePurchaseOrder, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { vendor, items, expectedDeliveryDate, deliveryAddress, paymentTerms, notes } = req.body;

    // Verify vendor exists
    const vendorDoc = await Contact.findById(vendor);
    if (!vendorDoc || !['Vendor', 'Both'].includes(vendorDoc.type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor selected'
      });
    }

    // Process items and calculate totals
    const processedItems = [];
    let subtotal = 0;
    let totalTaxAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      const itemTotal = item.quantity * item.unitPrice;
      const taxAmount = (itemTotal * item.taxPercent) / 100;

      processedItems.push({
        product: product._id,
        productName: product.name,
        hsnCode: product.hsnCode,
        quantity: item.quantity,
        unit: product.unit,
        unitPrice: item.unitPrice,
        taxPercent: item.taxPercent || 0,
        taxAmount: taxAmount,
        totalAmount: itemTotal + taxAmount
      });

      subtotal += itemTotal;
      totalTaxAmount += taxAmount;
    }

    const orderNumber = await generateOrderNumber();
    const totalAmount = subtotal + totalTaxAmount;

    const purchaseOrder = new PurchaseOrder({
      orderNumber,
      vendor: vendorDoc._id,
      vendorName: vendorDoc.name,
      vendorEmail: vendorDoc.email,
      vendorAddress: vendorDoc.address,
      vendorGST: vendorDoc.gstNumber,
      expectedDeliveryDate,
      items: processedItems,
      subtotal,
      taxAmount: totalTaxAmount,
      totalAmount,
      deliveryAddress,
      paymentTerms,
      notes,
      createdBy: req.user.id
    });

    await purchaseOrder.save();

    // Populate the response
    await purchaseOrder.populate('vendor', 'name email mobile');
    await purchaseOrder.populate('items.product', 'name hsnCode unit');
    await purchaseOrder.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating purchase order',
      error: error.message
    });
  }
});

// PUT /api/purchase-orders/:id - Update purchase order
router.put('/:id', authenticateToken, authorize('Admin', 'Accountant'), validatePurchaseOrder, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Check if order can be modified
    if (['Received', 'Cancelled'].includes(purchaseOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed or cancelled purchase order'
      });
    }

    const { vendor, items, expectedDeliveryDate, deliveryAddress, paymentTerms, notes } = req.body;

    // Verify vendor exists
    const vendorDoc = await Contact.findById(vendor);
    if (!vendorDoc || !['Vendor', 'Both'].includes(vendorDoc.type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor selected'
      });
    }

    // Process items and calculate totals
    const processedItems = [];
    let subtotal = 0;
    let totalTaxAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      const itemTotal = item.quantity * item.unitPrice;
      const taxAmount = (itemTotal * item.taxPercent) / 100;

      processedItems.push({
        product: product._id,
        productName: product.name,
        hsnCode: product.hsnCode,
        quantity: item.quantity,
        unit: product.unit,
        unitPrice: item.unitPrice,
        taxPercent: item.taxPercent || 0,
        taxAmount: taxAmount,
        totalAmount: itemTotal + taxAmount,
        receivedQuantity: item.receivedQuantity || 0
      });

      subtotal += itemTotal;
      totalTaxAmount += taxAmount;
    }

    const totalAmount = subtotal + totalTaxAmount;

    // Update purchase order
    Object.assign(purchaseOrder, {
      vendor: vendorDoc._id,
      vendorName: vendorDoc.name,
      vendorEmail: vendorDoc.email,
      vendorAddress: vendorDoc.address,
      vendorGST: vendorDoc.gstNumber,
      expectedDeliveryDate,
      items: processedItems,
      subtotal,
      taxAmount: totalTaxAmount,
      totalAmount,
      deliveryAddress,
      paymentTerms,
      notes
    });

    await purchaseOrder.save();

    // Populate the response
    await purchaseOrder.populate('vendor', 'name email mobile');
    await purchaseOrder.populate('items.product', 'name hsnCode unit');
    await purchaseOrder.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Purchase order updated successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating purchase order',
      error: error.message
    });
  }
});

// PUT /api/purchase-orders/:id/status - Update purchase order status
router.put('/:id/status', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { status, receivedItems } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    const validStatuses = ['Draft', 'Sent', 'Confirmed', 'Partially Received', 'Received', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    purchaseOrder.status = status;

    // Handle received items and update inventory
    if (status === 'Partially Received' || status === 'Received') {
      if (receivedItems && receivedItems.length > 0) {
        for (const receivedItem of receivedItems) {
          const orderItem = purchaseOrder.items.id(receivedItem.itemId);
          if (orderItem) {
            orderItem.receivedQuantity += receivedItem.quantity;
            
            // Update inventory
            let inventory = await Inventory.findOne({ product: orderItem.product });
            if (!inventory) {
              inventory = new Inventory({ product: orderItem.product });
            }
            
            await inventory.addTransaction({
              transactionType: 'Purchase',
              quantity: receivedItem.quantity,
              unitPrice: orderItem.unitPrice,
              totalValue: receivedItem.quantity * orderItem.unitPrice,
              referenceDocument: {
                documentType: 'PurchaseOrder',
                documentId: purchaseOrder._id,
                documentNumber: purchaseOrder.orderNumber
              },
              createdBy: req.user.id
            });
          }
        }
      }
    }

    if (status === 'Confirmed') {
      purchaseOrder.approvedBy = req.user.id;
      purchaseOrder.approvedAt = new Date();
    }

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order status updated successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating purchase order status',
      error: error.message
    });
  }
});

// DELETE /api/purchase-orders/:id - Delete purchase order (soft delete)
router.delete('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Check if order can be deleted
    if (['Confirmed', 'Partially Received', 'Received'].includes(purchaseOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete confirmed or received purchase order'
      });
    }

    purchaseOrder.isActive = false;
    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting purchase order',
      error: error.message
    });
  }
});

// GET /api/purchase-orders/stats/summary - Get purchase order statistics
router.get('/stats/summary', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const stats = await PurchaseOrder.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const summary = {
      total: 0,
      totalAmount: 0,
      byStatus: {}
    };

    stats.forEach(stat => {
      summary.total += stat.count;
      summary.totalAmount += stat.totalAmount;
      summary.byStatus[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount
      };
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching purchase order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase order statistics',
      error: error.message
    });
  }
});

module.exports = router;
