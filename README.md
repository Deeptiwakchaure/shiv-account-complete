# Shiv Accounts Cloud
Demo video link : https://drive.google.com/file/d/1i1wmQKYC-u95qZoGbkRKJ9oDVHpze6R1/view?usp=sharing  
A comprehensive cloud-based accounting and inventory management system designed specifically for Shiv Furniture. This full-stack application provides complete business management capabilities including master data management, transaction processing, and real-time reporting.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Authentication**: JWT-based with role-based access control
- **Database**: MongoDB with Mongoose ODM
- **API Integration**: GST HSN Code API integration

## 🚀 Features

### Authentication & User Management

- **Role-based Access Control**: Admin, Accountant, and Contact user roles
- **Secure Login System**: Email/password authentication with session management
- **User Management**: Admin can manage users and assign roles

### Master Data Management

- **Contact Master**: Manage customers and vendors with complete contact information
- **Product Master**: Track products and services with pricing, tax, and inventory details
- **Tax Master**: Configure tax rules and rates for sales and purchases
- **Chart of Accounts**: Manage ledger accounts (Assets, Liabilities, Income, Expenses, Equity)

### Transaction Management

- **Purchase Orders**: Create and manage purchase orders from vendors
- **Vendor Bills**: Convert purchase orders to bills and track payments
- **Sales Orders**: Manage customer orders and quotations
- **Customer Invoices**: Generate invoices and track customer payments

### Real-time Reporting

- **Balance Sheet**: Real-time financial position with assets, liabilities, and equity
- **Profit & Loss**: Income statement showing revenue, expenses, and net profit/loss
- **Stock Report**: Inventory levels, stock valuation, and low stock alerts
- **Partner Ledger**: Detailed transaction history with customers and vendors

### Dashboard & Analytics

- **Real-time Dashboard**: Key metrics, recent transactions, and quick actions
- **Financial Summary**: Overview of business performance
- **Quick Actions**: Fast access to common tasks

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom component library
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form for form management
- **Notifications**: React Hot Toast
- **Routing**: React Router DOM
- **State Management**: React Context API

## 📦 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Deeptiwakchaure/shiv-account.git
   cd shiv-account
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   npm run dev
   ```

3. **Frontend Setup**

   ```bash
   cd ..  # Go back to project root
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## 🔐 Demo Credentials

### Admin User

- **Email**: admin@shivfurniture.com
- **Password**: admin123
- **Access**: Full system access

### Accountant User

- **Email**: accountant@shivfurniture.com
- **Password**: acc123
- **Access**: Master data, transactions, and reports

## 📋 System Overview

### User Roles

#### Admin (Business Owner)

- Full access to all modules
- User management
- System configuration
- All reports and analytics

#### Accountant

- Master data management
- Transaction recording
- Report generation
- Limited administrative functions

#### Contact (Customer/Vendor)

- View own invoices/bills
- Make payments
- Limited portal access

### Business Workflow

#### Purchase Cycle

1. **Create Purchase Order** → Select vendor and products
2. **Convert to Vendor Bill** → Add invoice details and due dates
3. **Record Payment** → Track payments via cash or bank

#### Sales Cycle

1. **Create Sales Order** → Select customer and products
2. **Convert to Invoice** → Generate customer invoice
3. **Record Payment** → Track customer payments

#### Reporting

- **Real-time Updates**: All reports update automatically
- **Date Filtering**: Custom date ranges for all reports
- **Export Capabilities**: PDF and Excel export (planned)

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Auth/                 # Authentication components
│   ├── Dashboard/            # Dashboard and analytics
│   ├── Layout/               # Navigation and layout
│   ├── Masters/              # Master data management
│   ├── Transactions/         # Transaction modules
│   └── Reports/              # Reporting components
├── context/                  # React Context providers
├── types/                    # TypeScript type definitions
└── App.tsx                   # Main application component
```

## 🎯 Key Features Implemented

### ✅ Completed

- [x] Project setup with TypeScript and Tailwind CSS
- [x] Authentication system with role-based access
- [x] Master data modules (Contacts, Products, Taxes, Chart of Accounts)
- [x] Purchase Orders transaction module
- [x] Real-time dashboard with analytics
- [x] Comprehensive reporting system
- [x] Responsive design and modern UI
- [x] Data validation and form management

### 🚧 In Progress

- [ ] Complete transaction modules (Vendor Bills, Sales Orders, Customer Invoices)
- [ ] Payment recording and tracking
- [ ] Export functionality (PDF/Excel)
- [ ] Advanced business logic and validation
- [ ] Data persistence and backend integration

## 🔧 Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Tailwind CSS for styling
- Component-based architecture
- Context API for state management

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:

- Desktop computers
- Tablets
- Mobile devices

## 🚀 Deployment

The application can be deployed to any static hosting service:

- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is proprietary software developed for Shiv Furniture.

## 📞 Support

For support and questions, please contact the development team.

---

**Shiv Accounts Cloud** - Streamlining business operations for modern furniture businesses.
