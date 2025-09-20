import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Contact,
  Product,
  Tax,
  Account,
  PurchaseOrder,
  VendorBill,
  VendorPayment,
  SalesOrder,
  CustomerInvoice,
  CustomerPayment,
  LedgerEntry,
  BalanceSheet,
  ProfitLoss,
  StockReport,
  PartnerLedger
} from '../types';

interface DataContextType {
  // Users
  users: User[];
  currentUser: User | null;
  
  // Master Data
  contacts: Contact[];
  products: Product[];
  taxes: Tax[];
  accounts: Account[];
  
  // Transactions
  purchaseOrders: PurchaseOrder[];
  vendorBills: VendorBill[];
  vendorPayments: VendorPayment[];
  salesOrders: SalesOrder[];
  customerInvoices: CustomerInvoice[];
  customerPayments: CustomerPayment[];
  
  // Ledger
  ledgerEntries: LedgerEntry[];
  
  // Actions
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  addTax: (tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTax: (id: string, tax: Partial<Tax>) => void;
  deleteTax: (id: string) => void;
  
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  
  // Transaction Actions
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addVendorBill: (bill: Omit<VendorBill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addVendorPayment: (payment: Omit<VendorPayment, 'id' | 'createdAt'>) => void;
  
  addSalesOrder: (so: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addCustomerInvoice: (invoice: Omit<CustomerInvoice, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addCustomerPayment: (payment: Omit<CustomerPayment, 'id' | 'createdAt'>) => void;
  
  // Reports
  getBalanceSheet: () => BalanceSheet;
  getProfitLoss: (fromDate: Date, toDate: Date) => ProfitLoss;
  getStockReport: () => StockReport[];
  getPartnerLedger: (contactId: string, fromDate: Date, toDate: Date) => PartnerLedger;
  
  // Utility
  generateId: () => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@shivfurniture.com',
    password: 'admin123',
    role: 'Admin',
    name: 'Admin User',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    email: 'accountant@shivfurniture.com',
    password: 'acc123',
    role: 'Accountant',
    name: 'Accountant User',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Azure Furniture',
    type: 'Vendor',
    email: 'contact@azurefurniture.com',
    mobile: '9876543210',
    address: '123 Furniture Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    balance: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Nimesh Pathak',
    type: 'Customer',
    email: 'nimesh@email.com',
    mobile: '9876543211',
    address: '456 Customer Lane',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    balance: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Office Chair',
    type: 'Goods',
    category: 'Furniture',
    salesPrice: 5000,
    purchasePrice: 1000,
    salesTaxPercent: 5,
    purchaseTaxPercent: 5,
    hsnCode: '9401',
    stock: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockTaxes: Tax[] = [
  {
    id: '1',
    name: 'GST 5%',
    rate: 5,
    computationMethod: 'Percentage',
    applicableOn: 'Both',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'GST 10%',
    rate: 10,
    computationMethod: 'Percentage',
    applicableOn: 'Both',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockAccounts: Account[] = [
  { id: '1', name: 'Cash', type: 'Asset', balance: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Bank', type: 'Asset', balance: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'Debtors', type: 'Asset', balance: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: 'Creditors', type: 'Liability', balance: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: '5', name: 'Sales Income', type: 'Income', balance: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: '6', name: 'Purchase Expense', type: 'Expense', balance: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: '7', name: 'Inventory', type: 'Asset', balance: 0, createdAt: new Date(), updatedAt: new Date() }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users] = useState<User[]>(mockUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [taxes, setTaxes] = useState<Tax[]>(mockTaxes);
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoice[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Master Data Actions
  const addContact = (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setContacts(prev => [...prev, newContact]);
  };

  const updateContact = (id: string, contact: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...contact, updatedAt: new Date() } : c));
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, product: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product, updatedAt: new Date() } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addTax = (tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTax: Tax = {
      ...tax,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTaxes(prev => [...prev, newTax]);
  };

  const updateTax = (id: string, tax: Partial<Tax>) => {
    setTaxes(prev => prev.map(t => t.id === id ? { ...t, ...tax, updatedAt: new Date() } : t));
  };

  const deleteTax = (id: string) => {
    setTaxes(prev => prev.filter(t => t.id !== id));
  };

  const addAccount = (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAccount: Account = {
      ...account,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setAccounts(prev => [...prev, newAccount]);
  };

  const updateAccount = (id: string, account: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...account, updatedAt: new Date() } : a));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  // Transaction Actions
  const addPurchaseOrder = (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPO: PurchaseOrder = {
      ...po,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setPurchaseOrders(prev => [...prev, newPO]);
  };

  const addVendorBill = (bill: Omit<VendorBill, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBill: VendorBill = {
      ...bill,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setVendorBills(prev => [...prev, newBill]);
  };

  const addVendorPayment = (payment: Omit<VendorPayment, 'id' | 'createdAt'>) => {
    const newPayment: VendorPayment = {
      ...payment,
      id: generateId(),
      createdAt: new Date()
    };
    setVendorPayments(prev => [...prev, newPayment]);
  };

  const addSalesOrder = (so: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSO: SalesOrder = {
      ...so,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSalesOrders(prev => [...prev, newSO]);
  };

  const addCustomerInvoice = (invoice: Omit<CustomerInvoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newInvoice: CustomerInvoice = {
      ...invoice,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCustomerInvoices(prev => [...prev, newInvoice]);
  };

  const addCustomerPayment = (payment: Omit<CustomerPayment, 'id' | 'createdAt'>) => {
    const newPayment: CustomerPayment = {
      ...payment,
      id: generateId(),
      createdAt: new Date()
    };
    setCustomerPayments(prev => [...prev, newPayment]);
  };

  // Report Functions
  const getBalanceSheet = (): BalanceSheet => {
    const currentAssets = accounts.filter(a => a.type === 'Asset' && ['Cash', 'Bank', 'Debtors', 'Inventory'].includes(a.name));
    const fixedAssets = accounts.filter(a => a.type === 'Asset' && !['Cash', 'Bank', 'Debtors', 'Inventory'].includes(a.name));
    const currentLiabilities = accounts.filter(a => a.type === 'Liability' && a.name === 'Creditors');
    const longTermLiabilities = accounts.filter(a => a.type === 'Liability' && a.name !== 'Creditors');
    const equity = accounts.filter(a => a.type === 'Equity');

    const totalCurrentAssets = currentAssets.reduce((sum, a) => sum + a.balance, 0);
    const totalFixedAssets = fixedAssets.reduce((sum, a) => sum + a.balance, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    const totalCurrentLiabilities = currentLiabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalLongTermLiabilities = longTermLiabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    return {
      assets: {
        currentAssets,
        fixedAssets,
        totalCurrentAssets,
        totalFixedAssets,
        totalAssets
      },
      liabilities: {
        currentLiabilities,
        longTermLiabilities,
        totalCurrentLiabilities,
        totalLongTermLiabilities,
        totalLiabilities
      },
      equity: {
        accounts: equity,
        totalEquity
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity
    };
  };

  const getProfitLoss = (fromDate: Date, toDate: Date): ProfitLoss => {
    const sales = accounts.find(a => a.name === 'Sales Income')?.balance || 0;
    const purchases = accounts.find(a => a.name === 'Purchase Expense')?.balance || 0;
    
    return {
      income: {
        sales,
        otherIncome: 0,
        totalIncome: sales
      },
      expenses: {
        purchases,
        operatingExpenses: 0,
        otherExpenses: 0,
        totalExpenses: purchases
      },
      netProfit: sales - purchases
    };
  };

  const getStockReport = (): StockReport[] => {
    return products.map(product => ({
      productId: product.id,
      product,
      openingStock: 0,
      purchases: 0, // This would be calculated from purchase transactions
      sales: 0, // This would be calculated from sales transactions
      closingStock: product.stock,
      value: product.stock * product.purchasePrice
    }));
  };

  const getPartnerLedger = (contactId: string, fromDate: Date, toDate: Date): PartnerLedger => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    // This would be calculated from actual transactions
    const transactions: LedgerEntry[] = [];
    const openingBalance = 0;
    const closingBalance = contact.balance;
    const totalDebit = 0;
    const totalCredit = 0;

    return {
      contactId,
      contact,
      transactions,
      openingBalance,
      closingBalance,
      totalDebit,
      totalCredit
    };
  };

  const value: DataContextType = {
    users,
    currentUser,
    contacts,
    products,
    taxes,
    accounts,
    purchaseOrders,
    vendorBills,
    vendorPayments,
    salesOrders,
    customerInvoices,
    customerPayments,
    ledgerEntries,
    addContact,
    updateContact,
    deleteContact,
    addProduct,
    updateProduct,
    deleteProduct,
    addTax,
    updateTax,
    deleteTax,
    addAccount,
    updateAccount,
    deleteAccount,
    addPurchaseOrder,
    addVendorBill,
    addVendorPayment,
    addSalesOrder,
    addCustomerInvoice,
    addCustomerPayment,
    getBalanceSheet,
    getProfitLoss,
    getStockReport,
    getPartnerLedger,
    generateId
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
