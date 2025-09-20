import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { PurchaseOrder, Contact, Product } from '../../types';
import { Plus, Edit, Trash2, Search, ShoppingCart, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const PurchaseOrders: React.FC = () => {
  const { 
    purchaseOrders, 
    addPurchaseOrder, 
    contacts, 
    products, 
    generateId 
  } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Draft' | 'Sent' | 'Received' | 'Cancelled'>('All');

  const [formData, setFormData] = useState({
    vendorId: '',
    items: [] as Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      taxPercent: number;
    }>,
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    notes: ''
  });

  const vendors = contacts.filter(c => c.type === 'Vendor' || c.type === 'Both');

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || po.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleOpenModal = (po?: PurchaseOrder) => {
    if (po) {
      setEditingPO(po);
      setFormData({
        vendorId: po.vendorId,
        items: po.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxPercent: item.taxPercent
        })),
        orderDate: po.orderDate.toISOString().split('T')[0],
        expectedDate: po.expectedDate?.toISOString().split('T')[0] || '',
        notes: po.notes || ''
      });
    } else {
      setEditingPO(null);
      setFormData({
        vendorId: '',
        items: [],
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPO(null);
    setFormData({
      vendorId: '',
      items: [],
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
      notes: ''
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 0, unitPrice: 0, taxPercent: 0 }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    let totalAmount = 0;
    let taxAmount = 0;
    
    formData.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const itemTotal = item.quantity * item.unitPrice;
        const itemTax = (itemTotal * item.taxPercent) / 100;
        totalAmount += itemTotal;
        taxAmount += itemTax;
      }
    });

    return {
      totalAmount,
      taxAmount,
      grandTotal: totalAmount + taxAmount
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendorId || formData.items.length === 0) {
      toast.error('Please select a vendor and add at least one item');
      return;
    }

    const vendor = vendors.find(v => v.id === formData.vendorId);
    if (!vendor) {
      toast.error('Please select a valid vendor');
      return;
    }

    const totals = calculateTotals();
    const poData = {
      vendorId: formData.vendorId,
      vendor,
      items: formData.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        const itemTotal = item.quantity * item.unitPrice;
        const itemTax = (itemTotal * item.taxPercent) / 100;
        
        return {
          id: generateId(),
          productId: item.productId,
          product: product!,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxPercent: item.taxPercent,
          taxAmount: itemTax,
          totalAmount: itemTotal + itemTax
        };
      }),
      totalAmount: totals.totalAmount,
      taxAmount: totals.taxAmount,
      grandTotal: totals.grandTotal,
      status: 'Draft' as const,
      orderDate: new Date(formData.orderDate),
      expectedDate: formData.expectedDate ? new Date(formData.expectedDate) : undefined,
      notes: formData.notes
    };

    addPurchaseOrder(poData);
    toast.success('Purchase Order created successfully!');
    handleCloseModal();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Sent': return 'bg-blue-100 text-blue-800';
      case 'Received': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your purchase orders
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create PO
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search purchase orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-header-row">
                <th className="table-header-cell">PO Number</th>
                <th className="table-header-cell">Vendor</th>
                <th className="table-header-cell">Order Date</th>
                <th className="table-header-cell">Expected Date</th>
                <th className="table-header-cell">Total Amount</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredPOs.map((po) => (
                <tr key={po.id} className="table-row">
                  <td className="table-cell">
                    <div className="text-sm font-medium text-gray-900">
                      PO-{po.id.slice(-6)}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{po.vendor.name}</div>
                    <div className="text-sm text-gray-500">{po.vendor.email}</div>
                  </td>
                  <td className="table-cell text-sm text-gray-900">
                    {po.orderDate.toLocaleDateString()}
                  </td>
                  <td className="table-cell text-sm text-gray-900">
                    {po.expectedDate ? po.expectedDate.toLocaleDateString() : '-'}
                  </td>
                  <td className="table-cell">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{po.grandTotal.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {po.items.length} items
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(po)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(po)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vendor *</label>
                    <select
                      required
                      value={formData.vendorId}
                      onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                      className="input mt-1"
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name} - {vendor.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                      className="input mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Date</label>
                    <input
                      type="date"
                      value={formData.expectedDate}
                      onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="input mt-1"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">Items</label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="btn btn-secondary btn-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </button>
                  </div>

                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                          className="input mt-1"
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} - ₹{product.purchasePrice}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="input mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="input mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tax %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.taxPercent}
                          onChange={(e) => updateItem(index, 'taxPercent', parseFloat(e.target.value) || 0)}
                          className="input mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                          ₹{((item.quantity * item.unitPrice) * (1 + item.taxPercent / 100)).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                {formData.items.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{calculateTotals().totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span>₹{calculateTotals().taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>₹{calculateTotals().grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-md"
                  >
                    {editingPO ? 'Update' : 'Create'} PO
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

export default PurchaseOrders;
