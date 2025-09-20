import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { TrendingUp, Plus, Search, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSOsApi, createSOApi } from '../../lib/api';
import { useLocation } from 'react-router-dom';

const SalesOrders: React.FC = () => {
  const { products, contacts } = useData();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Draft' | 'Confirmed' | 'Delivered' | 'Cancelled'>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSO, setEditingSO] = useState<any | null>(null);
  const [form, setForm] = useState({
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    notes: '',
    items: [] as Array<{ productId: string; quantity: number; unitPrice: number; taxPercent: number }>,
  });

  const customers = contacts.filter(c => c.type === 'Customer' || c.type === 'Both');

  const filteredSOs = useMemo(() => {
    return salesOrders.filter((so) => {
      const matchesSearch = (so.customerName || so.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (so.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'All' || so.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [salesOrders, searchTerm, filterStatus]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await getSOsApi({ limit: 50 });
        if (resp?.data) setSalesOrders(resp.data);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load sales orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Deep link modal open
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('open') === '1') handleOpenModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 0, unitPrice: 0, taxPercent: 0 }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, key: string, val: any) => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) }));

  const totals = useMemo(() => {
    let sub = 0, tax = 0;
    form.items.forEach(it => {
      const itemTotal = (it.quantity || 0) * (it.unitPrice || 0);
      sub += itemTotal;
      tax += (itemTotal * (it.taxPercent || 0)) / 100;
    });
    return { subTotal: sub, tax, grand: sub + tax };
  }, [form.items]);

  const handleOpenModal = (so?: any) => {
    if (so) {
      setEditingSO(so);
      setForm({
        customerId: (so.customer && so.customer._id) || '',
        orderDate: so.orderDate ? new Date(so.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expectedDate: so.expectedDeliveryDate ? new Date(so.expectedDeliveryDate).toISOString().split('T')[0] : '',
        notes: so.notes || '',
        items: (so.items || []).map((row: any) => ({
          productId: row.product?._id || '',
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          taxPercent: row.taxPercent || 0,
        }))
      });
    } else {
      setEditingSO(null);
      setForm({ customerId: '', orderDate: new Date().toISOString().split('T')[0], expectedDate: '', notes: '', items: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSO(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || form.items.length === 0) {
      toast.error('Select customer and add at least one item');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        customer: form.customerId,
        orderDate: form.orderDate,
        expectedDeliveryDate: form.expectedDate,
        notes: form.notes,
        items: form.items.map(it => ({ product: it.productId, quantity: it.quantity, unitPrice: it.unitPrice, taxPercent: it.taxPercent })),
      };
      const resp = await createSOApi(payload);
      const created = (resp as any).data;
      setSalesOrders(prev => [created, ...prev]);
      toast.success('Sales Order created');
      handleCloseModal();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create sales order');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Confirmed': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Manage sales orders and convert to invoices</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary btn-md">
          <Plus className="h-4 w-4 mr-2" /> Create SO
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input className="input pl-10" placeholder="Search sales orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="input">
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-header-row">
                <th className="table-header-cell">SO Number</th>
                <th className="table-header-cell">Customer</th>
                <th className="table-header-cell">Order Date</th>
                <th className="table-header-cell">Expected Date</th>
                <th className="table-header-cell">Total</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {(loading ? [] : filteredSOs).map(so => (
                <tr key={so._id || so.id} className="table-row">
                  <td className="table-cell text-sm font-medium text-gray-900">{so.orderNumber || `SO-${(so._id || '').slice(-6)}`}</td>
                  <td className="table-cell text-sm text-gray-900">{so.customerName || so.customer?.name}</td>
                  <td className="table-cell text-sm text-gray-900">{so.orderDate ? new Date(so.orderDate).toLocaleDateString() : '-'}</td>
                  <td className="table-cell text-sm text-gray-900">{so.expectedDeliveryDate ? new Date(so.expectedDeliveryDate).toLocaleDateString() : '-'}</td>
                  <td className="table-cell text-sm font-semibold text-gray-900">₹{(so.totalAmount || 0).toLocaleString()}</td>
                  <td className="table-cell"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor(so.status)}`}>{so.status}</span></td>
                  <td className="table-cell">
                    <button className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1" onClick={() => handleOpenModal(so)}>
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td className="table-cell text-center py-8" colSpan={7}>
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Loading sales orders...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filteredSOs.length === 0 && (
                <tr>
                  <td className="table-cell text-center py-12" colSpan={7}>
                    <div className="text-gray-500 flex flex-col items-center gap-2">
                      <TrendingUp className="h-8 w-8" />
                      <div className="text-sm">No sales orders found. Click "Create SO" to add one.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{editingSO ? 'Edit Sales Order' : 'Create Sales Order'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer *</label>
                    <select required className="input mt-1" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                      <option value="">Select Customer</option>
                      {customers.map(c => (<option key={c.id} value={c.id}>{c.name} - {c.email}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Date *</label>
                    <input type="date" className="input mt-1" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Date</label>
                    <input type="date" className="input mt-1" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <input type="text" className="input mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Items</label>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add Item</button>
                  </div>
                  {form.items.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Product</label>
                        <select className="input mt-1" value={row.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)}>
                          <option value="">Select Product</option>
                          {products.map(p => (<option key={p.id} value={p.id}>{p.name} - ₹{p.salesPrice}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Qty</label>
                        <input type="number" min={1} className="input mt-1" value={row.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                        <input type="number" min={0} step={0.01} className="input mt-1" value={row.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tax %</label>
                        <input type="number" min={0} max={100} step={0.01} className="input mt-1" value={row.taxPercent} onChange={(e) => updateItem(idx, 'taxPercent', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="flex items-end">
                        <div className="text-sm bg-gray-50 rounded p-2 w-full">₹{((row.quantity * row.unitPrice) * (1 + (row.taxPercent || 0)/100)).toFixed(2)}</div>
                      </div>
                      <div className="flex items-end">
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

                {form.items.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm"><span>Subtotal:</span><span>₹{totals.subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span>Tax:</span><span>₹{totals.tax.toFixed(2)}</span></div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2"><span>Total:</span><span>₹{totals.grand.toFixed(2)}</span></div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" className="btn btn-secondary btn-md" onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-md">{editingSO ? 'Update' : 'Create'} SO</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;
