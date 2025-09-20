import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { TrendingUp, Download, Calendar } from 'lucide-react';

const ProfitLoss: React.FC = () => {
  const { getProfitLoss } = useData();
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  
  const profitLoss = getProfitLoss(new Date(fromDate), new Date(toDate));

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting Profit & Loss...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h1>
          <p className="mt-1 text-sm text-gray-500">
            Income and expenses from {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input"
            />
          </div>
          <button
            onClick={handleExport}
            className="btn btn-primary btn-md"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Profit & Loss Statement */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <h3 className="text-lg font-medium text-blue-900">PROFIT & LOSS STATEMENT</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* Income Section */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">INCOME</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Sales Income</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₹{profitLoss.income.sales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Other Income</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₹{profitLoss.income.otherIncome.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b-2 border-gray-300 font-medium">
                  <span className="text-sm text-gray-700">Total Income</span>
                  <span className="text-sm text-gray-900">
                    ₹{profitLoss.income.totalIncome.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">EXPENSES</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Purchases</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₹{profitLoss.expenses.purchases.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Operating Expenses</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₹{profitLoss.expenses.operatingExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Other Expenses</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₹{profitLoss.expenses.otherExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b-2 border-gray-300 font-medium">
                  <span className="text-sm text-gray-700">Total Expenses</span>
                  <span className="text-sm text-gray-900">
                    ₹{profitLoss.expenses.totalExpenses.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Profit/Loss */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Net Profit/Loss</span>
                <span className={`text-2xl font-bold ${
                  profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{profitLoss.netProfit.toLocaleString()}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-center">
                  <TrendingUp className={`h-4 w-4 mr-2 ${
                    profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className={`text-sm ${
                    profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {profitLoss.netProfit >= 0 ? 'Profit' : 'Loss'} for the period
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{profitLoss.income.totalIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-red-600 rotate-180" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{profitLoss.expenses.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              profitLoss.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <TrendingUp className={`h-6 w-6 ${
                profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Profit/Loss</p>
              <p className={`text-2xl font-semibold ${
                profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{profitLoss.netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss;
