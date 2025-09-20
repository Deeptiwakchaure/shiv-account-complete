import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Package, Download, Search, AlertTriangle } from 'lucide-react';
import { exportStockReportToPDF } from '../../utils/exportUtils';

const StockReport: React.FC = () => {
  const { getStockReport, products } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const stockReport = getStockReport();
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredReport = stockReport.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExport = () => {
    try {
      exportStockReportToPDF(filteredReport);
    } catch (error) {
      console.error('Error exporting Stock Report:', error);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (stock <= 10) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  const totalValue = filteredReport.reduce((sum, item) => sum + item.value, 0);
  const lowStockItems = filteredReport.filter(item => item.closingStock <= 10).length;
  const outOfStockItems = filteredReport.filter(item => item.closingStock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Current inventory levels and stock valuation
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-primary btn-md"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredReport.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">₹{totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{outOfStockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stock Report Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-header-row">
                <th className="table-header-cell">Product</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Opening Stock</th>
                <th className="table-header-cell">Purchases</th>
                <th className="table-header-cell">Sales</th>
                <th className="table-header-cell">Closing Stock</th>
                <th className="table-header-cell">Unit Price</th>
                <th className="table-header-cell">Value</th>
                <th className="table-header-cell">Status</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredReport.map((item) => {
                const stockStatus = getStockStatus(item.closingStock);
                return (
                  <tr key={item.productId} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                          <div className="text-sm text-gray-500">{item.product.hsnCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-900">{item.product.category}</td>
                    <td className="table-cell text-sm text-gray-900">{item.openingStock}</td>
                    <td className="table-cell text-sm text-gray-900">{item.purchases}</td>
                    <td className="table-cell text-sm text-gray-900">{item.sales}</td>
                    <td className="table-cell">
                      <span className="text-sm font-medium text-gray-900">{item.closingStock}</span>
                    </td>
                    <td className="table-cell text-sm text-gray-900">₹{item.product.purchasePrice.toLocaleString()}</td>
                    <td className="table-cell">
                      <span className="text-sm font-medium text-gray-900">₹{item.value.toLocaleString()}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Low Stock Alert
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You have {lowStockItems} product{lowStockItems > 1 ? 's' : ''} with low stock levels. 
                  Consider reordering to avoid stockouts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Out of Stock Alert */}
      {outOfStockItems > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Out of Stock Alert
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  You have {outOfStockItems} product{outOfStockItems > 1 ? 's' : ''} that are out of stock. 
                  Please reorder immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockReport;
