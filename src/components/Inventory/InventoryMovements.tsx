import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, Calendar, Filter, Download } from 'lucide-react';
import { getInventoryMovementsApi, getInventoryApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface InventoryMovement {
  _id: string;
  product: {
    _id: string;
    name: string;
    category: string;
  };
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unitPrice: number;
  totalValue: number;
  referenceType: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'OPENING';
  referenceId: string;
  referenceNumber: string;
  movementDate: string;
  notes?: string;
  createdBy: {
    name: string;
  };
}

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  recentMovements: number;
}

const InventoryMovements: React.FC = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    recentMovements: 0
  });
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'IN' | 'OUT' | 'ADJUSTMENT'>('All');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadInventoryData();
  }, [filterType, dateRange]);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      // Get inventory movements
      const movementsResponse = await getInventoryMovementsApi({
        page: 1,
        limit: 100,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        movementType: filterType === 'All' ? undefined : filterType
      });

      let movements = [];
      if (movementsResponse.success && movementsResponse.data) {
        movements = movementsResponse.data;
      }

      // Get inventory stats
      const inventoryResponse = await getInventoryApi({ lowStock: true });
      let totalProducts = 0;
      let totalValue = 0;
      let lowStockItems = 0;

      if (inventoryResponse.success && inventoryResponse.data) {
        const inventoryData = inventoryResponse.data;
        totalProducts = inventoryData.length;

        // Calculate total value and low stock items
        inventoryData.forEach((item: any) => {
          totalValue += (item.quantity * item.unitPrice) || 0;
          if (item.quantity <= item.minStock || 0) {
            lowStockItems++;
          }
        });
      }

      setMovements(movements);
      setStats({
        totalProducts,
        totalValue,
        lowStockItems,
        recentMovements: movements.length
      });

    } catch (error: any) {
      toast.error(error?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'OUT': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ADJUSTMENT': return <Package className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'IN': return 'bg-green-100 text-green-800';
      case 'OUT': return 'bg-red-100 text-red-800';
      case 'ADJUSTMENT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => `₹${Math.abs(amount).toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Movements</h1>
          <p className="mt-1 text-sm text-gray-500">Track all inventory transactions and movements</p>
        </div>
        <button className="btn btn-secondary btn-md">
          <Download className="h-4 w-4 mr-2" /> Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Movements</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.recentMovements}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input"
            >
              <option value="All">All Movements</option>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
              <option value="ADJUSTMENT">Adjustments</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-header-row">
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Product</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Quantity</th>
                <th className="table-header-cell">Unit Price</th>
                <th className="table-header-cell">Total Value</th>
                <th className="table-header-cell">Reference</th>
                <th className="table-header-cell">Created By</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {loading ? (
                <tr>
                  <td className="table-cell text-center py-8" colSpan={8}>
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                      Loading movements...
                    </div>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td className="table-cell text-center py-12" colSpan={8}>
                    <div className="text-gray-500 flex flex-col items-center gap-2">
                      <Package className="h-8 w-8" />
                      <div className="text-sm">No inventory movements found for the selected criteria</div>
                    </div>
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement._id} className="table-row">
                    <td className="table-cell text-sm text-gray-900">
                      {formatDate(movement.movementDate)}
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{movement.product.name}</div>
                        <div className="text-xs text-gray-500">{movement.product.category}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        {getMovementIcon(movement.movementType)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMovementColor(movement.movementType)}`}>
                          {movement.movementType}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-sm font-medium text-gray-900">
                      <span className={movement.quantity < 0 ? 'text-red-600' : 'text-green-600'}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-gray-900">
                      {formatCurrency(movement.unitPrice)}
                    </td>
                    <td className="table-cell text-sm font-semibold">
                      <span className={movement.totalValue < 0 ? 'text-red-600' : 'text-green-600'}>
                        {movement.totalValue < 0 ? '-' : '+'}{formatCurrency(movement.totalValue)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{movement.referenceNumber}</div>
                        <div className="text-xs text-gray-500">{movement.referenceType}</div>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-900">
                      {movement.createdBy.name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryMovements;
