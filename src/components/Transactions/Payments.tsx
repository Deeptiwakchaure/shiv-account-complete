import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLocation } from 'react-router-dom';
import { getPaymentsApi, createPaymentApi, updatePaymentApi, deletePaymentApi, getOutstandingByContactApi } from '../../lib/api';
import { Search, DollarSign, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AllocationItem {
  id: string;
  docType: 'invoice' | 'bill';
  number: string;
  date: string;
  dueDate?: string;
  contactName: string;
  currency: string;
  outstanding: number;
  allocate: number;
}

const Payments: React.FC = () => {
  const { contacts } = useData();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);

  const [form, setForm] = useState({
    contactId: '',
    mode: 'Cash' as 'Cash' | 'Bank',
    amount: 0,
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);

  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;
    const s = searchTerm.toLowerCase();
    return payments.filter(p =>
      (p.contactName || '').toLowerCase().includes(s) ||
      (p.reference || '').toLowerCase().includes(s)
    );
  }, [payments, searchTerm]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await getPaymentsApi({ limit: 50 });
        if (resp?.data?.payments) {
          setPayments(resp.data.payments);
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('open') === '1') {
      handleOpenModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleOpenModal = (payment?: any) => {
    if (payment) {
      setEditingPayment(payment);
      setForm({
        contactId: payment.contact?._id || '',
        mode: payment.mode || 'Cash',
        amount: payment.amount || 0,
        reference: payment.reference || '',
        date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: payment.notes || '',
      });
      // Existing allocations not reloaded here for simplicity
    } else {
      setEditingPayment(null);
      setForm({
        contactId: '',
        mode: 'Cash',
        amount: 0,
        reference: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setAllocations([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPayment(null);
    setAllocations([]);
  };

  const loadOutstanding = async (contactId: string) => {
    if (!contactId) return;
    try {
      setLoading(true);
      const resp = await getOutstandingByContactApi(contactId);
      const inv = resp.data?.invoices || [];
      const bills = resp.data?.bills || [];
      const mapped: AllocationItem[] = [
        ...inv.map((x: any) => ({
          id: x._id,
          docType: 'invoice' as const,
          number: x.invoiceNumber || `INV-${(x._id || '').slice(-6)}`,
          date: x.invoiceDate,
          dueDate: x.dueDate,
          contactName: x.customer?.name || '',
          currency: 'INR',
          outstanding: x.outstandingAmount ?? x.totalAmount ?? 0,
          allocate: 0,
        })),
        ...bills.map((x: any) => ({
          id: x._id,
          docType: 'bill' as const,
          number: x.billNumber || `BILL-${(x._id || '').slice(-6)}`,
          date: x.billDate,
          dueDate: x.dueDate,
          contactName: x.vendor?.name || '',
          currency: 'INR',
          outstanding: x.outstandingAmount ?? x.totalAmount ?? 0,
          allocate: 0,
        })),
      ];
      setAllocations(mapped);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load outstanding documents');
    } finally {
      setLoading(false);
    }
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.allocate) || 0), 0);
  const remaining = Math.max(0, (Number(form.amount) || 0) - totalAllocated);

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactId || !form.amount) {
      toast.error('Select contact and enter amount');
      return;
    }

    if (totalAllocated > form.amount) {
      toast.error('Allocated amount exceeds payment amount');
      return;
    }

    const payload = {
      contact: form.contactId,
      mode: form.mode,
      amount: Number(form.amount) || 0,
      reference: form.reference,
      date: form.date,
      notes: form.notes,
      allocations: allocations
        .filter(a => (Number(a.allocate) || 0) > 0)
        .map(a => ({
          type: a.docType === 'invoice' ? 'Invoice' : 'Bill',
          ref: a.id,
          amount: Number(a.allocate) || 0,
        })),
    };

    try {
      setLoading(true);
      if (editingPayment) {
        const resp = await updatePaymentApi(editingPayment._id, payload);
        const updated = (resp as any).data.payment;
        setPayments(prev => prev.map(p => (p._id === updated._id ? updated : p)));
        toast.success('Payment updated');
      } else {
        const resp = await createPaymentApi(payload);
        const created = (resp as any).data.payment;
        setPayments(prev => [created, ...prev]);
        toast.success('Payment recorded');
      }
      handleCloseModal();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      setLoading(true);
      await deletePaymentApi(id);
      setPayments(prev => prev.filter(p => p._id !== id));
      toast.success('Payment deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">Record customer receipts and vendor payments, and allocate them to invoices/bills.</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" /> Record Payment
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
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-header-row">
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Contact</th>
                <th className="table-header-cell">Mode</th>
                <th className="table-header-cell">Reference</th>
                <th className="table-header-cell">Amount</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {(loading ? [] : filteredPayments).map(p => (
                <tr key={p._id} className="table-row">
                  <td className="table-cell text-sm text-gray-900">{p.date ? new Date(p.date).toLocaleDateString() : '-'}</td>
                  <td className="table-cell text-sm text-gray-900">{p.contactName || p.contact?.name}</td>
                  <td className="table-cell text-sm text-gray-900">{p.mode}</td>
                  <td className="table-cell text-sm text-gray-900">{p.reference || '-'}</td>
                  <td className="table-cell text-sm font-semibold text-gray-900">₹{(p.amount || 0).toLocaleString()}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button className="text-primary-600 hover:text-primary-900" onClick={() => handleOpenModal(p)}>Edit</button>
                      <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(p._id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td className="table-cell text-center py-8" colSpan={6}>
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Loading payments...
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
          <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPayment ? 'Edit Payment' : 'Record Payment'}
              </h3>
              <form onSubmit={submitPayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact *</label>
                    <select
                      required
                      value={form.contactId}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm({ ...form, contactId: v });
                        loadOutstanding(v);
                      }}
                      className="input mt-1"
                    >
                      <option value="">Select Contact</option>
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mode *</label>
                    <select
                      value={form.mode}
                      onChange={(e) => setForm({ ...form, mode: e.target.value as any })}
                      className="input mt-1"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date *</label>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount *</label>
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="input mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference</label>
                    <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="input mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input mt-1" />
                  </div>
                </div>

                {/* Allocations */}
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Allocate to Documents</h4>
                    <div className="text-xs text-gray-500">Remaining: ₹{remaining.toFixed(2)}</div>
                  </div>
                  {allocations.length === 0 ? (
                    <div className="text-sm text-gray-500 bg-gray-50 rounded p-3">Select a contact to load open invoices/bills.</div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto border border-gray-200 rounded">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-700">
                            <th className="px-3 py-2 text-left">Doc</th>
                            <th className="px-3 py-2">Outstanding</th>
                            <th className="px-3 py-2">Allocate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allocations.map((a, idx) => (
                            <tr key={a.id} className="border-t">
                              <td className="px-3 py-2">
                                <div className="font-medium text-gray-900">{a.number}</div>
                                <div className="text-xs text-gray-500">{a.docType.toUpperCase()} • {a.date ? new Date(a.date).toLocaleDateString() : '-'}</div>
                              </td>
                              <td className="px-3 py-2 text-center font-medium text-gray-900">₹{(a.outstanding || 0).toLocaleString()}</td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={a.allocate}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value) || 0;
                                    setAllocations(prev => prev.map((x, i) => i === idx ? { ...x, allocate: Math.min(v, x.outstanding) } : x));
                                  }}
                                  className="input w-32"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" className="btn btn-secondary btn-md" onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-md">
                    <DollarSign className="h-4 w-4 mr-1" /> {editingPayment ? 'Update' : 'Record'} Payment
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

export default Payments;
