import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { DollarSign, Plus, Search, Edit, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPaymentsApi, createPaymentApi, getInvoicesApi, getBillsApi } from '../../lib/api';
import { useLocation } from 'react-router-dom';

const Payments: React.FC = () => {
  const { contacts } = useData();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Received' | 'Paid'>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [form, setForm] = useState({
    type: 'Received' as 'Received' | 'Paid',
    contactId: '',
    documentId: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash' as 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI',
    reference: '',
    notes: '',
  });

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch = (p.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.reference || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'All' || p.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [payments, searchTerm, filterType]);

  const availableDocuments = useMemo(() => {
    if (form.type === 'Received') {
      return invoices.filter(inv => inv.customer === form.contactId && inv.balanceAmount > 0);
    } else {
      return bills.filter(bill => bill.vendor === form.contactId && bill.balanceAmount > 0);
    }
  }, [form.type, form.contactId, invoices, bills]);

  const selectedDocument = useMemo(() => {
    return availableDocuments.find(doc => doc._id === form.documentId);
  }, [availableDocuments, form.documentId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [paymentsResp, invoicesResp, billsResp] = await Promise.all([
          getPaymentsApi({ limit: 50 }),
          getInvoicesApi({ limit: 100 }),
          getBillsApi({ limit: 100 })
        ]);
        if (paymentsResp?.data) setPayments(paymentsResp.data);
        if (invoicesResp?.data) setInvoices(invoicesResp.data);
        if (billsResp?.data) setBills(billsResp.data);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('open') === '1') handleOpenModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleOpenModal = (payment?: any) => {
    if (payment) {
      setEditingPayment(payment);
      setForm({
        type: payment.type,
        contactId: payment.contact || '',
        documentId: payment.document || '',
        amount: payment.amount,
        paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMethod: payment.paymentMethod,
        reference: payment.reference || '',
        notes: payment.notes || '',
      });
    } else {
      setEditingPayment(null);
      setForm({
        type: 'Received',
        contactId: '',
        documentId: '',
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        reference: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPayment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactId || !form.documentId || form.amount <= 0) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        type: form.type,
        contact: form.contactId,
        document: form.documentId,
        amount: form.amount,
        paymentDate: form.paymentDate,
        paymentMethod: form.paymentMethod,
        reference: form.reference,
        notes: form.notes,
      };
      const resp = await createPaymentApi(payload);
      const created = (resp as any).data;
      setPayments(prev => [created, ...prev]);
      toast.success('Payment recorded successfully');
      handleCloseModal();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const getContacts = () => {
    if (form.type === 'Received') {
      return contacts.filter(c => c.type === 'Customer' || c.type === 'Both');
    } else {
      return contacts.filter(c => c.type === 'Vendor' || c.type === 'Both');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">Record and manage payments</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary btn-md">
          <Plus className="h-4 w-4 mr-2" /> Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input className="input pl-10" placeholder="Search payments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="input">
              <option value="All">All Types</option>
              <option value="Received">Received</option>
              <option value="Paid">Paid</option>
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
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Contact</th>
                <th className="table-header-cell">Document</th>
                <th className="table-header-cell">Amount</th>
                <th className="table-header-cell">Method</th>
                <th className="table-header-cell">Reference</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {(loading ? [] : filtered).map(payment => (
                <tr key={payment._id || payment.id} className="table-row">
                  <td className="table-cell text-sm text-gray-900">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.type === 'Received' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.type}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-gray-900">{payment.contactName}</td>
                  <td className="table-cell text-sm text-gray-900">{payment.documentNumber}</td>
                  <td className="table-cell text-sm font-semibold text-gray-900">₹{(payment.amount || 0).toLocaleString()}</td>
                  <td className="table-cell text-sm text-gray-900">{payment.paymentMethod}</td>
                  <td className="table-cell text-sm text-gray-900">{payment.reference || '-'}</td>
                  <td className="table-cell">
                    <button className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1" onClick={() => handleOpenModal(payment)}>
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td className="table-cell text-center py-8" colSpan={8}>
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Loading payments...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="table-cell text-center py-12" colSpan={8}>
                    <div className="text-gray-500 flex flex-col items-center gap-2">
                      <CreditCard className="h-8 w-8" />
                      <div className="text-sm">No payments found. Click "Record Payment" to add one.</div>
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
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{editingPayment ? 'Edit Payment' : 'Record Payment'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Type *</label>
                    <select required className="input mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any, contactId: '', documentId: '' })}>
                      <option value="Received">Payment Received (from Customer)</option>
                      <option value="Paid">Payment Made (to Vendor)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Date *</label>
                    <input type="date" required className="input mt-1" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{form.type === 'Received' ? 'Customer' : 'Vendor'} *</label>
                    <select required className="input mt-1" value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value, documentId: '' })}>
                      <option value="">Select {form.type === 'Received' ? 'Customer' : 'Vendor'}</option>
                      {getContacts().map(c => (<option key={c.id} value={c.id}>{c.name} - {c.email}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{form.type === 'Received' ? 'Invoice' : 'Bill'} *</label>
                    <select required className="input mt-1" value={form.documentId} onChange={(e) => setForm({ ...form, documentId: e.target.value })}>
                      <option value="">Select {form.type === 'Received' ? 'Invoice' : 'Bill'}</option>
                      {availableDocuments.map(doc => (
                        <option key={doc._id} value={doc._id}>
                          {doc.invoiceNumber || doc.billNumber} - ₹{doc.balanceAmount?.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount *</label>
                    <input 
                      type="number" 
                      required 
                      min={0.01} 
                      max={selectedDocument?.balanceAmount || undefined}
                      step={0.01} 
                      className="input mt-1" 
                      value={form.amount} 
                      onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} 
                    />
                    {selectedDocument && (
                      <p className="text-xs text-gray-500 mt-1">Balance: ₹{selectedDocument.balanceAmount?.toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                    <select required className="input mt-1" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference</label>
                    <input type="text" className="input mt-1" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Transaction ID, Cheque No, etc." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <input type="text" className="input mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" className="btn btn-secondary btn-md" onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-md">{editingPayment ? 'Update' : 'Record'} Payment</button>
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