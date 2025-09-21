import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Edit, Search } from 'lucide-react';
import { getInventoryApi, adjustInventoryApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface InventoryItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    category: string;
    hsnCode: string;
  };
  quantity: number;
  unitPrice: number;
  minStock: number;
  maxStock: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

interface StockAdjustment {
  productId: string;
  productName: string;
  currentStock: number;
  adjustmentType: 'Add' | 'Remove' | 'Set';
  quantity: number;
  reason: string;
}

const InventoryManagement: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [adjustment, setAdjustment] = useState<StockAdjustment>({
    productId: '',
    productName: '',
    currentStock: 0,
    adjustmentType: 'Add',
    quantity: 0,
    reason: ''
  });

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const response = await getInventoryApi({ lowStock: true });
      if (response.success && response.data) {
        setInventory(response.data);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (item.quantity <= item.minStock) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustment.productId || !adjustment.reason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      // Calculate final quantity for validation
      switch (adjustment.adjustmentType) {
        case 'Add':
        case 'Remove':
        case 'Set':
          break;
      }

      await adjustInventoryApi(adjustment.productId, {
        transactionType: 'Adjustment',
        quantity: adjustment.adjustmentType === 'Remove' ? -adjustment.quantity : adjustment.quantity,
        unitPrice: 0,
        notes: adjustment.reason
      });

      toast.success('Stock adjusted successfully');
      setShowAdjustmentModal(false);
      loadInventoryData();

    } catch (error: any) {
      toast.error(error?.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const openAdjustmentModal = (item: InventoryItem) => {
    setSelectedProduct(item);
    setAdjustment({
      productId: item.product._id,
      productName: item.product.name,
      currentStock: item.quantity,
      adjustmentType: 'Add',
      quantity: 0,
      reason: ''
    });
    setShowAdjustmentModal(true);
  };

  const filteredInventory = inventory.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor and manage stock levels</p>
        </div>
        <button
          onClick={() => loadInventoryData()}
          className="btn btn-primary btn-md"
          disabled={loading}
        >
          <Package className="h-4 w-4 mr-2" />
          Refresh
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
              <p className="text-2xl font-semibold text-gray-900">{inventory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventory.filter(item => item.quantity > item.minStock).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{lowStockItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventory.filter(item => item.quantity <= 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">Low Stock Alert</h3>
          </div>
          <p className="mt-1 text-sm text-yellow-700">
            {lowStockItems.length} product{lowStockItems.length > 1 ? 's' : ''} have low stock levels and need attention.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-header-row">
                <th className="table-header-cell">Product</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Current Stock</th>
                <th className="table-header-cell">Min Stock</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Last Updated</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {loading ? (
                <tr>
                  <td className="table-cell text-center py-8" colSpan={7}>
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                      Loading inventory...
                    </div>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td className="table-cell text-center py-12" colSpan={7}>
                    <div className="text-gray-500 flex flex-col items-center gap-2">
                      <Package className="h-8 w-8" />
                      <div className="text-sm">No inventory items found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item._id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-xs text-gray-500">HSN: {item.product.hsnCode}</div>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-900">{item.product.category}</td>
                    <td className="table-cell text-sm font-medium text-gray-900">{item.quantity}</td>
                    <td className="table-cell text-sm text-gray-900">{item.minStock}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatus(item).color}`}>
                        {getStockStatus(item).status}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-gray-900">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => openAdjustmentModal(item)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adjust Stock</h3>
              <form onSubmit={handleStockAdjustment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md">
                    <p className="font-medium">{adjustment.productName}</p>
                    <p className="text-sm text-gray-500">Current Stock: {adjustment.currentStock}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Adjustment Type</label>
                  <select
                    value={adjustment.adjustmentType}
                    onChange={(e) => setAdjustment({...adjustment, adjustmentType: e.target.value as any})}
                    className="input mt-1"
                  >
                    <option value="Add">Add Stock</option>
                    <option value="Remove">Remove Stock</option>
                    <option value="Set">Set Stock Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity {adjustment.adjustmentType === 'Set' ? '' : 'to Adjust'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adjustment.quantity}
                    onChange={(e) => setAdjustment({...adjustment, quantity: parseInt(e.target.value) || 0})}
                    className="input mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason *</label>
                  <textarea
                    required
                    value={adjustment.reason}
                    onChange={(e) => setAdjustment({...adjustment, reason: e.target.value})}
                    className="input mt-1"
                    rows={3}
                    placeholder="Reason for stock adjustment..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdjustmentModal(false)}
                    className="btn btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-md"
                    disabled={loading}
                  >
                    {loading ? 'Adjusting...' : 'Adjust Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
