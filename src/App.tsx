import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './components/Auth/Login';
import { Register } from './components/Auth';
import Welcome from './components/Public/Welcome';
import Dashboard from './components/Dashboard/Dashboard';
import Layout from './components/Layout/Layout';
import ContactMaster from './components/Masters/ContactMaster';
import ProductMaster from './components/Masters/ProductMaster';
import TaxMaster from './components/Masters/TaxMaster';
import ChartOfAccounts from './components/Masters/ChartOfAccounts';
import PurchaseOrders from './components/Transactions/PurchaseOrders';
import VendorBills from './components/Transactions/VendorBills';
import SalesOrders from './components/Transactions/SalesOrders';
import CustomerInvoices from './components/Transactions/CustomerInvoices';
import BalanceSheet from './components/Reports/BalanceSheet';
import ProfitLoss from './components/Reports/ProfitLoss';
import StockReport from './components/Reports/StockReport';
import PartnerLedger from './components/Reports/PartnerLedger';
import LoadingOverlay from './components/Common/LoadingOverlay';
import { useEffect, useState } from 'react';
import Payments from './components/Transactions/Payments';
import ContactPortal from './components/Contact/ContactPortal';

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'Contact') {
    return <Navigate to="/contact-portal" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ 
  children, 
  roles = ['Admin', 'Accountant', 'Contact'] 
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // Contact users should go to their portal, others to dashboard
    return <Navigate to={user.role === 'Contact' ? '/contact-portal' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Contact Portal Route */}
        <Route path="/contact-portal" element={
          <ProtectedRoute roles={['Contact']}>
            <ContactPortal />
          </ProtectedRoute>
        } />
        
        {/* Master Data Routes */}
        <Route path="/masters/contacts" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <ContactMaster />
          </ProtectedRoute>
        } />
        <Route path="/masters/products" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <ProductMaster />
          </ProtectedRoute>
        } />
        <Route path="/masters/taxes" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <TaxMaster />
          </ProtectedRoute>
        } />
        <Route path="/masters/chart-of-accounts" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <ChartOfAccounts />
          </ProtectedRoute>
        } />
        
        {/* Transaction Routes */}
        <Route path="/transactions/purchase-orders" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <PurchaseOrders />
          </ProtectedRoute>
        } />
        <Route path="/transactions/payments" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <Payments />
          </ProtectedRoute>
        } />
        <Route path="/transactions/vendor-bills" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <VendorBills />
          </ProtectedRoute>
        } />
        <Route path="/transactions/sales-orders" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <SalesOrders />
          </ProtectedRoute>
        } />
        <Route path="/transactions/customer-invoices" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <CustomerInvoices />
          </ProtectedRoute>
        } />
        
        {/* Report Routes */}
        <Route path="/reports/balance-sheet" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <BalanceSheet />
          </ProtectedRoute>
        } />
        <Route path="/reports/profit-loss" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <ProfitLoss />
          </ProtectedRoute>
        } />
        <Route path="/reports/stock" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <StockReport />
          </ProtectedRoute>
        } />
        <Route path="/reports/partner-ledger" element={
          <ProtectedRoute roles={['Admin', 'Accountant']}>
            <PartnerLedger />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  const [loadingCount, setLoadingCount] = useState(0);

  useEffect(() => {
    const onStart = () => setLoadingCount((c) => c + 1);
    const onEnd = () => setLoadingCount((c) => Math.max(0, c - 1));
    window.addEventListener('api:request-start' as any, onStart);
    window.addEventListener('api:request-end' as any, onEnd);
    return () => {
      window.removeEventListener('api:request-start' as any, onStart);
      window.removeEventListener('api:request-end' as any, onEnd);
    };
  }, []);

  return (
    <DataProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <div className="App">
              <AppRoutes />
              <LoadingOverlay visible={loadingCount > 0} />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </div>
        </Router>
      </AuthProvider>
    </DataProvider>
  );
};

export default App;
