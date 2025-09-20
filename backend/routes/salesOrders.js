const express = require('express');
const { body, validationResult } = require('express-validator');
const SalesOrder = require('../models/SalesOrder');
const Contact = require('../models/Contact');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateSalesOrder = [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').notEmpty().withMessage('Product is required for each item'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
  body('expectedDeliveryDate').isISO8601().withMessage('Valid expected delivery date is required'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required')
];

// Generate sales order number
const generateOrderNumber = async () => {
  const count = await SalesOrder.countDocuments();
  return `SO${String(count + 1).padStart(6, '0')}`;
};

// GET /api/sales-orders - Get all sales orders
router.get('/', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      customer, 
      priority,
      startDate, 
      endDate,
      search 
    } = req.query;

    const filter = { isActive: true };
    
    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    if (priority) filter.priority = priority;
    if (startDate && endDate) {
      filter.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    const salesOrders = await SalesOrder.find(filter)
      .populate('customer', 'name email mobile')
      .populate('items.product', 'name hsnCode unit')
      .populate('createdBy', 'name email')
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SalesOrder.countDocuments(filter);

    res.json({
      success: true,
      data: salesOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales orders',
      error: error.message
    });
  }
});

// GET /api/sales-orders/:id - Get single sales order
router.get('/:id', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const salesOrder = await SalesOrder.findById(req.params.id)
      .populate('customer')
      .populate('items.product')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    res.json({
      success: true,
      data: salesOrder
    });
  } catch (error) {
    console.error('Error fetching sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales order',
      error: error.message
    });
  }
});

// POST /api/sales-orders - Create new sales order
router.post('/', authenticateToken, authorize('Admin', 'Accountant'), validateSalesOrder, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { customer, items, expectedDeliveryDate, deliveryAddress, paymentTerms, notes, priority } = req.body;

    // Verify customer exists
    const customerDoc = await Contact.findById(customer);
    if (!customerDoc || !['Customer', 'Both'].includes(customerDoc.type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer selected'
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

      // Check stock availability
      const inventory = await Inventory.findOne({ product: product._id });
      if (inventory && inventory.availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${inventory.availableStock}, Required: ${item.quantity}`
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

    const salesOrder = new SalesOrder({
      orderNumber,
      customer: customerDoc._id,
      customerName: customerDoc.name,
      customerEmail: customerDoc.email,
      customerAddress: customerDoc.address,
      customerGST: customerDoc.gstNumber,
      expectedDeliveryDate,
      items: processedItems,
      subtotal,
      taxAmount: totalTaxAmount,
      totalAmount,
      deliveryAddress,
      paymentTerms,
      notes,
      priority: priority || 'Medium',
      createdBy: req.user.id
    });

    await salesOrder.save();

    // Reserve stock for confirmed orders
    if (salesOrder.status === 'Confirmed') {
      for (const item of processedItems) {
        const inventory = await Inventory.findOne({ product: item.product });
        if (inventory) {
          await inventory.reserveStock(item.quantity);
        }
      }
    }

    // Populate the response
    await salesOrder.populate('customer', 'name email mobile');
    await salesOrder.populate('items.product', 'name hsnCode unit');
    await salesOrder.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Sales order created successfully',
      data: salesOrder
    });
  } catch (error) {
    console.error('Error creating sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sales order',
      error: error.message
    });
  }
});

// PUT /api/sales-orders/:id - Update sales order
router.put('/:id', authenticateToken, authorize('Admin', 'Accountant'), validateSalesOrder, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    // Check if order can be modified
    if (['Delivered', 'Cancelled'].includes(salesOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed or cancelled sales order'
      });
    }

    const { customer, items, expectedDeliveryDate, deliveryAddress, paymentTerms, notes, priority } = req.body;

    // Verify customer exists
    const customerDoc = await Contact.findById(customer);
    if (!customerDoc || !['Customer', 'Both'].includes(customerDoc.type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer selected'
      });
    }

    // Release previously reserved stock
    for (const item of salesOrder.items) {
      const inventory = await Inventory.findOne({ product: item.product });
      if (inventory) {
        await inventory.releaseReservedStock(item.quantity);
      }
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
        deliveredQuantity: item.deliveredQuantity || 0
      });

      subtotal += itemTotal;
      totalTaxAmount += taxAmount;
    }

    const totalAmount = subtotal + totalTaxAmount;

    // Update sales order
    Object.assign(salesOrder, {
      customer: customerDoc._id,
      customerName: customerDoc.name,
      customerEmail: customerDoc.email,
      customerAddress: customerDoc.address,
      customerGST: customerDoc.gstNumber,
      expectedDeliveryDate,
      items: processedItems,
      subtotal,
      taxAmount: totalTaxAmount,
      totalAmount,
      deliveryAddress,
      paymentTerms,
      notes,
      priority: priority || salesOrder.priority
    });

    await salesOrder.save();

    // Reserve stock again if confirmed
    if (salesOrder.status === 'Confirmed') {
      for (const item of processedItems) {
        const inventory = await Inventory.findOne({ product: item.product });
        if (inventory) {
          await inventory.reserveStock(item.quantity);
        }
      }
    }

    // Populate the response
    await salesOrder.populate('customer', 'name email mobile');
    await salesOrder.populate('items.product', 'name hsnCode unit');
    await salesOrder.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Sales order updated successfully',
      data: salesOrder
    });
  } catch (error) {
    console.error('Error updating sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating sales order',
      error: error.message
    });
  }
});

// PUT /api/sales-orders/:id/status - Update sales order status
router.put('/:id/status', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const { status, deliveredItems } = req.body;
    
    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    const validStatuses = ['Draft', 'Confirmed', 'In Production', 'Ready to Ship', 'Partially Delivered', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const oldStatus = salesOrder.status;
    salesOrder.status = status;

    // Handle stock reservations and deliveries
    if (status === 'Confirmed' && oldStatus === 'Draft') {
      // Reserve stock when confirming order
      for (const item of salesOrder.items) {
        const inventory = await Inventory.findOne({ product: item.product });
        if (inventory) {
          await inventory.reserveStock(item.quantity);
        }
      }
    }

    // Handle delivered items and update inventory
    if (status === 'Partially Delivered' || status === 'Delivered') {
      if (deliveredItems && deliveredItems.length > 0) {
        for (const deliveredItem of deliveredItems) {
          const orderItem = salesOrder.items.id(deliveredItem.itemId);
          if (orderItem) {
            orderItem.deliveredQuantity += deliveredItem.quantity;
            
            // Update inventory
            let inventory = await Inventory.findOne({ product: orderItem.product });
            if (inventory) {
              // Release reserved stock and reduce actual stock
              await inventory.releaseReservedStock(deliveredItem.quantity);
              
              await inventory.addTransaction({
                transactionType: 'Sale',
                quantity: deliveredItem.quantity,
                unitPrice: orderItem.unitPrice,
                totalValue: deliveredItem.quantity * orderItem.unitPrice,
                referenceDocument: {
                  documentType: 'SalesOrder',
                  documentId: salesOrder._id,
                  documentNumber: salesOrder.orderNumber
                },
                createdBy: req.user.id
              });
            }
          }
        }
      }
    }

    if (status === 'Cancelled') {
      // Release all reserved stock
      for (const item of salesOrder.items) {
        const inventory = await Inventory.findOne({ product: item.product });
        if (inventory) {
          await inventory.releaseReservedStock(item.quantity - item.deliveredQuantity);
        }
      }
    }

    if (status === 'Confirmed') {
      salesOrder.approvedBy = req.user.id;
      salesOrder.approvedAt = new Date();
    }

    await salesOrder.save();

    res.json({
      success: true,
      message: 'Sales order status updated successfully',
      data: salesOrder
    });
  } catch (error) {
    console.error('Error updating sales order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating sales order status',
      error: error.message
    });
  }
});

// DELETE /api/sales-orders/:id - Delete sales order (soft delete)
router.delete('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    // Check if order can be deleted
    if (['Confirmed', 'In Production', 'Ready to Ship', 'Partially Delivered', 'Delivered'].includes(salesOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete confirmed or processed sales order'
      });
    }

    salesOrder.isActive = false;
    await salesOrder.save();

    res.json({
      success: true,
      message: 'Sales order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sales order',
      error: error.message
    });
  }
});

// GET /api/sales-orders/stats/summary - Get sales order statistics
router.get('/stats/summary', authenticateToken, authorize('Admin', 'Accountant'), async (req, res) => {
  try {
    const stats = await SalesOrder.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const priorityStats = await SalesOrder.aggregate([
      { $match: { isActive: true, status: { $nin: ['Delivered', 'Cancelled'] } } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      total: 0,
      totalAmount: 0,
      byStatus: {},
      byPriority: {}
    };

    stats.forEach(stat => {
      summary.total += stat.count;
      summary.totalAmount += stat.totalAmount;
      summary.byStatus[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount
      };
    });

    priorityStats.forEach(stat => {
      summary.byPriority[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching sales order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales order statistics',
      error: error.message
    });
  }
});

module.exports = router;
