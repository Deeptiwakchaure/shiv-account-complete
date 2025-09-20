const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Contact = require('../models/Contact');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const ChartOfAccounts = require('../models/ChartOfAccounts');
const Tax = require('../models/Tax');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const Inventory = require('../models/Inventory');
const Expense = require('../models/Expense');

const initializeDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create collections and indexes
    console.log('🔄 Creating collections and indexes...');
    
    // Users collection
    await User.createIndexes();
    console.log('✅ User indexes created');

    // Contacts collection
    await Contact.createIndexes();
    console.log('✅ Contact indexes created');

    // Products collection
    await Product.createIndexes();
    console.log('✅ Product indexes created');

    // Invoices collection
    await Invoice.createIndexes();
    console.log('✅ Invoice indexes created');

    // Payments collection
    await Payment.createIndexes();
    console.log('✅ Payment indexes created');

    // Chart of Accounts collection
    await ChartOfAccounts.createIndexes();
    console.log('✅ Chart of Accounts indexes created');

    // Tax collection
    await Tax.createIndexes();
    console.log('✅ Tax indexes created');

    // Sales Orders collection
    await SalesOrder.createIndexes();
    console.log('✅ Sales Order indexes created');

    // Purchase Orders collection
    await PurchaseOrder.createIndexes();
    console.log('✅ Purchase Order indexes created');

    // Inventory collection
    await Inventory.createIndexes();
    console.log('✅ Inventory indexes created');

    // Expenses collection
    await Expense.createIndexes();
    console.log('✅ Expense indexes created');

    // Seed initial data
    await seedInitialData();

    console.log('🎉 Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

const seedInitialData = async () => {
  console.log('🔄 Seeding initial data...');

  // Create default admin user if not exists
  const adminExists = await User.findOne({ email: 'admin@shivaccounts.com' });
  if (!adminExists) {
    await User.create({
      name: 'System Administrator',
      email: 'admin@shivaccounts.com',
      password: 'admin123',
      role: 'Admin'
    });
    console.log('✅ Default admin user created');
  }

  // Create default chart of accounts
  const accountsExist = await ChartOfAccounts.countDocuments();
  if (accountsExist === 0) {
    const defaultAccounts = [
      { code: '1000', name: 'Cash', type: 'Asset', category: 'Current Assets' },
      { code: '1100', name: 'Bank Account', type: 'Asset', category: 'Current Assets' },
      { code: '1200', name: 'Accounts Receivable', type: 'Asset', category: 'Current Assets' },
      { code: '1300', name: 'Inventory', type: 'Asset', category: 'Current Assets' },
      { code: '2000', name: 'Accounts Payable', type: 'Liability', category: 'Current Liabilities' },
      { code: '2100', name: 'GST Payable', type: 'Liability', category: 'Current Liabilities' },
      { code: '3000', name: 'Owner Equity', type: 'Equity', category: 'Equity' },
      { code: '4000', name: 'Sales Revenue', type: 'Income', category: 'Revenue' },
      { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', category: 'Direct Expenses' },
      { code: '6000', name: 'Office Expenses', type: 'Expense', category: 'Operating Expenses' }
    ];

    await ChartOfAccounts.insertMany(defaultAccounts);
    console.log('✅ Default chart of accounts created');
  }

  // Create default tax rates
  const taxesExist = await Tax.countDocuments();
  if (taxesExist === 0) {
    const defaultTaxes = [
      { name: 'GST 0%', rate: 0, type: 'GST' },
      { name: 'GST 5%', rate: 5, type: 'GST' },
      { name: 'GST 12%', rate: 12, type: 'GST' },
      { name: 'GST 18%', rate: 18, type: 'GST' },
      { name: 'GST 28%', rate: 28, type: 'GST' }
    ];

    await Tax.insertMany(defaultTaxes);
    console.log('✅ Default tax rates created');
  }

  console.log('✅ Initial data seeding completed');
};

// Run initialization
initializeDatabase();