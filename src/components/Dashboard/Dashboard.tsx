import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Package,
  Receipt,
  DollarSign,
  ShoppingCart,
  FileText,
  BarChart3,
  AlertTriangle,
  Target
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

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
      color: 'from-blue-500/90 to-indigo-500/90',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'from-emerald-500/90 to-lime-500/90',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Purchase Orders',
      value: purchaseOrders.length,
      icon: ShoppingCart,
      color: 'from-amber-500/90 to-orange-500/90',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Sales Orders',
      value: salesOrders.length,
      icon: TrendingUp,
      color: 'from-purple-500/90 to-fuchsia-500/90',
      change: '+15%',
      changeType: 'positive'
    },
    {
      name: 'Customer Invoices',
      value: customerInvoices.length,
      icon: FileText,
      color: 'from-indigo-500/90 to-sky-500/90',
      change: '+3%',
      changeType: 'positive'
    },
    {
      name: 'Vendor Bills',
      value: vendorBills.length,
      icon: Receipt,
      color: 'from-rose-500/90 to-pink-500/90',
      change: '+7%',
      changeType: 'positive'
    }
  ];

  // Advanced Analytics Data
  const monthlyData = [
    { month: 'Jan', sales: 45000, purchases: 32000, profit: 13000 },
    { month: 'Feb', sales: 52000, purchases: 38000, profit: 14000 },
    { month: 'Mar', sales: 48000, purchases: 35000, profit: 13000 },
    { month: 'Apr', sales: 61000, purchases: 42000, profit: 19000 },
    { month: 'May', sales: 55000, purchases: 40000, profit: 15000 },
    { month: 'Jun', sales: 67000, purchases: 45000, profit: 22000 }
  ];

  const categoryData = [
    { name: 'Furniture', value: 45, color: '#8884d8' },
    { name: 'Accessories', value: 25, color: '#82ca9d' },
    { name: 'Decor', value: 20, color: '#ffc658' },
    { name: 'Others', value: 10, color: '#ff7c7c' }
  ];

  const kpiData = [
    { name: 'Revenue Growth', value: 15.3, target: 20, color: 'text-green-600' },
    { name: 'Profit Margin', value: 28.5, target: 25, color: 'text-blue-600' },
    { name: 'Customer Retention', value: 92.1, target: 90, color: 'text-purple-600' },
    { name: 'Inventory Turnover', value: 6.2, target: 8, color: 'text-orange-600' }
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

  // Notifications and Alerts
  const alerts = [
    { id: 1, type: 'warning', message: '3 products are low in stock', action: 'View Stock Report' },
    { id: 2, type: 'info', message: '5 invoices are due this week', action: 'View Invoices' },
    { id: 3, type: 'success', message: 'Monthly target achieved!', action: 'View Reports' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.name}! Here's what's happening with your business.
        </p>
      </div>

      {/* Stats Grid (polished) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl group-hover:opacity-20 transition" />
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-sm`}> 
                    <stat.icon className="h-6 w-6 text-white drop-shadow-sm" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 tracking-tight">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-xs font-semibold ${
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {kpiData.map((kpi) => (
          <div key={kpi.name} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{kpi.name}</p>
                <p className={`text-2xl font-semibold ${kpi.color}`}>
                  {kpi.value}%
                </p>
                <p className="text-xs text-gray-400">Target: {kpi.target}%</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Target className="h-6 w-6 text-gray-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    kpi.value >= kpi.target ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
            Alerts & Notifications
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                alert.type === 'info' ? 'bg-blue-50 border-blue-400' :
                'bg-green-50 border-green-400'
              }`}>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  <button className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                    {alert.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
              Monthly Performance
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
                  <Area type="monotone" dataKey="sales" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="purchases" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="profit" stackId="1" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Sales by Category
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
              className="flex flex-col items-center p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 hover:shadow-sm"
            >
              <Users className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Contact</span>
            </button>
            <button
              onClick={() => navigate('/masters/products?open=1')}
              className="flex flex-col items-center p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 hover:shadow-sm"
            >
              <Package className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Product</span>
            </button>
            <button
              onClick={() => navigate('/transactions/purchase-orders?open=1')}
              className="flex flex-col items-center p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 hover:shadow-sm"
            >
              <ShoppingCart className="h-8 w-8 text-yellow-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Create PO</span>
            </button>
            <button
              onClick={() => navigate('/transactions/sales-orders?open=1')}
              className="flex flex-col items-center p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 hover:shadow-sm"
            >
              <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Create SO</span>
            </button>
            <button
              onClick={() => navigate('/transactions/payments?open=1')}
              className="flex flex-col items-center p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 hover:shadow-sm"
            >
              <DollarSign className="h-8 w-8 text-emerald-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Record Payment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
