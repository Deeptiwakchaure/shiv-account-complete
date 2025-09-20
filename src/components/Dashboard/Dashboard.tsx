import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  Receipt,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  FileText,
  BarChart3
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    contacts, 
    products, 
    purchaseOrders, 
    salesOrders, 
    customerInvoices, 
    vendorBills,
    getBalanceSheet,
    getProfitLoss
  } = useData();
  const { user } = useAuth();

  const balanceSheet = getBalanceSheet();
  const profitLoss = getProfitLoss(new Date(2024, 0, 1), new Date());

  const stats = [
    {
      name: 'Total Contacts',
      value: contacts.length,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Purchase Orders',
      value: purchaseOrders.length,
      icon: ShoppingCart,
      color: 'bg-yellow-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Sales Orders',
      value: salesOrders.length,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    },
    {
      name: 'Customer Invoices',
      value: customerInvoices.length,
      icon: FileText,
      color: 'bg-indigo-500',
      change: '+3%',
      changeType: 'positive'
    },
    {
      name: 'Vendor Bills',
      value: vendorBills.length,
      icon: Receipt,
      color: 'bg-red-500',
      change: '+7%',
      changeType: 'positive'
    }
  ];

  const recentTransactions = [
    ...purchaseOrders.slice(-3).map(po => ({
      id: po.id,
      type: 'Purchase Order',
      description: `PO-${po.id.slice(-6)} - ${po.vendor.name}`,
      amount: po.grandTotal,
      date: po.orderDate,
      status: po.status
    })),
    ...salesOrders.slice(-3).map(so => ({
      id: so.id,
      type: 'Sales Order',
      description: `SO-${so.id.slice(-6)} - ${so.customer.name}`,
      amount: so.grandTotal,
      date: so.orderDate,
      status: so.status
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.name}! Here's what's happening with your business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Financial Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Total Assets</span>
                <span className="text-lg font-semibold text-gray-900">
                  ₹{balanceSheet.assets.totalAssets.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Total Liabilities</span>
                <span className="text-lg font-semibold text-gray-900">
                  ₹{balanceSheet.liabilities.totalLiabilities.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Total Equity</span>
                <span className="text-lg font-semibold text-gray-900">
                  ₹{balanceSheet.equity.totalEquity.toLocaleString()}
                </span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Net Profit/Loss</span>
                <span className={`text-lg font-semibold ${
                  profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{profitLoss.netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Transactions
            </h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction, index) => (
                    <li key={transaction.id}>
                      <div className="relative pb-8">
                        {index !== recentTransactions.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              transaction.type === 'Purchase Order' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}>
                              {transaction.type === 'Purchase Order' ? (
                                <ShoppingCart className="h-4 w-4 text-white" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-white" />
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(transaction.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <div className="font-medium text-gray-900">
                                ₹{transaction.amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                {transaction.status}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-center text-gray-500 py-4">
                    No recent transactions
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/masters/contacts?open=1')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Contact</span>
            </button>
            <button
              onClick={() => navigate('/masters/products?open=1')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Product</span>
            </button>
            <button
              onClick={() => navigate('/transactions/purchase-orders?open=1')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-yellow-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Create PO</span>
            </button>
            <button
              onClick={() => navigate('/transactions/sales-orders?open=1')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Create SO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
