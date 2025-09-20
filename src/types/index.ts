// User and Authentication Types
export interface User {
  id: string;
  email: string;
  password: string;
  role: 'Admin' | 'Accountant' | 'Contact';
  name: string;
  contactId?: string; // For Contact users, link to their contact record
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: { name: string; email: string; password: string; role?: string }) => Promise<boolean>;
  isAuthenticated: boolean;
}

// Contact Master Types
export interface Contact {
  id: string;
  name: string;
  type: 'Customer' | 'Vendor' | 'Both';
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  profileImage?: string;
  balance: number; // Outstanding balance
  createdAt: Date;
  updatedAt: Date;
}

// Product Master Types
export interface Product {
  id: string;
  name: string;
  type: 'Goods' | 'Service';
  category: string;
  salesPrice: number;
  purchasePrice: number;
  salesTaxPercent: number;
  purchaseTaxPercent: number;
  hsnCode: string;
  stock: number; // Current stock quantity
  createdAt: Date;
  updatedAt: Date;
}

// Tax Master Types
export interface Tax {
  id: string;
  name: string;
  rate: number;
  computationMethod: 'Percentage' | 'Fixed';
  applicableOn: 'Sales' | 'Purchase' | 'Both';
  createdAt: Date;
  updatedAt: Date;
}

// Chart of Accounts Types
export interface Account {
  id: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Income' | 'Expense' | 'Equity';
  parentId?: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  transactionId: string;
  transactionType: 'Purchase' | 'Sales' | 'Payment' | 'Receipt' | 'Journal';
  debit: number;
  credit: number;
  balance: number;
  description: string;
  date: Date;
  reference?: string;
}

// Transaction Types
export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendor: Contact;
  items: PurchaseOrderItem[];
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  status: 'Draft' | 'Sent' | 'Received' | 'Cancelled';
  orderDate: Date;
  expectedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
}

export interface VendorBill {
  id: string;
  purchaseOrderId?: string;
  vendorId: string;
  vendor: Contact;
  items: VendorBillItem[];
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  status: 'Draft' | 'Approved' | 'Paid' | 'Overdue';
  billDate: Date;
  dueDate: Date;
  invoiceNumber: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorBillItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
}

export interface VendorPayment {
  id: string;
  vendorBillId: string;
  vendorBill: VendorBill;
  amount: number;
  paymentMethod: 'Cash' | 'Bank';
  accountId: string;
  account: Account;
  paymentDate: Date;
  reference?: string;
  notes?: string;
  createdAt: Date;
}

export interface SalesOrder {
  id: string;
  customerId: string;
  customer: Contact;
  items: SalesOrderItem[];
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  status: 'Draft' | 'Sent' | 'Confirmed' | 'Cancelled';
  orderDate: Date;
  expectedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
}

export interface CustomerInvoice {
  id: string;
  salesOrderId?: string;
  customerId: string;
  customer: Contact;
  items: CustomerInvoiceItem[];
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  invoiceDate: Date;
  dueDate: Date;
  invoiceNumber: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerInvoiceItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
}

export interface CustomerPayment {
  id: string;
  customerInvoiceId: string;
  customerInvoice: CustomerInvoice;
  amount: number;
  paymentMethod: 'Cash' | 'Bank';
  accountId: string;
  account: Account;
  paymentDate: Date;
  reference?: string;
  notes?: string;
  createdAt: Date;
}

// Report Types
export interface BalanceSheet {
  assets: {
    currentAssets: Account[];
    fixedAssets: Account[];
    totalCurrentAssets: number;
    totalFixedAssets: number;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: Account[];
    longTermLiabilities: Account[];
    totalCurrentLiabilities: number;
    totalLongTermLiabilities: number;
    totalLiabilities: number;
  };
  equity: {
    accounts: Account[];
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}

export interface ProfitLoss {
  income: {
    sales: number;
    otherIncome: number;
    totalIncome: number;
  };
  expenses: {
    purchases: number;
    operatingExpenses: number;
    otherExpenses: number;
    totalExpenses: number;
  };
  netProfit: number;
}

export interface StockReport {
  productId: string;
  product: Product;
  openingStock: number;
  purchases: number;
  sales: number;
  closingStock: number;
  value: number;
}

export interface PartnerLedger {
  contactId: string;
  contact: Contact;
  transactions: LedgerEntry[];
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
}

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
  icon: string;
  children?: NavItem[];
  roles: ('Admin' | 'Accountant' | 'Contact')[];
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date' | 'file';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}
