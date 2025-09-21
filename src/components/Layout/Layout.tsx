import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import GlobalSearch from '../Common/GlobalSearch';
import NotificationSystem from '../Common/NotificationSystem';
import {
  Menu,
  X,
  Home,
  Users,
  Package,
  Receipt,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  ShoppingCart,
  DollarSign,
  Calculator,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    // Contact users get a simplified navigation
    ...(user?.role === 'Contact' ? [
      { name: 'My Portal', href: '/contact-portal', icon: Home, roles: ['Contact'] },
    ] : [
      { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['Admin', 'Accountant'] },
      {
        name: 'Master Data',
        icon: Settings,
        roles: ['Admin', 'Accountant'],
        children: [
          { name: 'Contacts', href: '/masters/contacts', icon: Users },
          { name: 'Products', href: '/masters/products', icon: Package },
          { name: 'Taxes', href: '/masters/taxes', icon: Receipt },
          { name: 'Chart of Accounts', href: '/masters/chart-of-accounts', icon: FileText },
        ]
      },
      {
        name: 'Transactions',
        icon: DollarSign,
        roles: ['Admin', 'Accountant'],
        children: [
          { name: 'Purchase Orders', href: '/transactions/purchase-orders', icon: ShoppingCart },
          { name: 'Vendor Bills', href: '/transactions/vendor-bills', icon: FileText },
          { name: 'Sales Orders', href: '/transactions/sales-orders', icon: Calculator },
          { name: 'Customer Invoices', href: '/transactions/customer-invoices', icon: Receipt },
          { name: 'Payments', href: '/transactions/payments', icon: DollarSign },
          { name: 'Expenses', href: '/transactions/expenses', icon: Receipt },
        ]
      },
      {
        name: 'Reports',
        icon: BarChart3,
        roles: ['Admin', 'Accountant'],
        children: [
          { name: 'Balance Sheet', href: '/reports/balance-sheet', icon: BarChart3 },
          { name: 'Profit & Loss', href: '/reports/profit-loss', icon: Calculator },
          { name: 'Stock Report', href: '/reports/stock', icon: Package },
          { name: 'Partner Ledger', href: '/reports/partner-ledger', icon: Users },
        ]
      },
    ])
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  const isActive = (href: string) => location.pathname === href;

  const NavItem: React.FC<{ item: any; level?: number }> = ({ item, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    const isActiveItem = item.href ? isActive(item.href) : false;

    if (hasChildren) {
      return (
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActiveItem
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            style={{ paddingLeft: `${level * 1 + 0.75}rem` }}
          >
            <div className="flex items-center">
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && (
            <div className="mt-1 space-y-1">
              {item.children.map((child: any) => (
                <NavItem key={child.href} item={child} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.href}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          isActiveItem
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        style={{ paddingLeft: `${level * 1 + 0.75}rem` }}
      >
        <item.icon className="mr-3 h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Building2 className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Shiv Accounts</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <Building2 className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Shiv Accounts</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {filteredNavigation.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header with search */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full max-w-lg">
                  <GlobalSearch />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-4">
                <NotificationSystem />
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
