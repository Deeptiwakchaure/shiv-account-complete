import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Download, Eye, CreditCard, Plus } from 'lucide-react';
import { getInvoicesApi, getBillsApi, getPaymentsApi, createPaymentApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
}

interface Bill {
  _id: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
}

interface Payment {
  _id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  type: string;
  paymentMethod: string;
  documentNumber: string;
}

const ContactPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'invoices' | 'bills' | 'payments'>('invoices');
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');

  useEffect(() => {
    if (user?.contactId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.contactId, activeTab]);

  const loadData = async () => {
    if (!user?.contactId) return;
    
    setLoading(true);
    try {
      switch (activeTab) {
        case 'invoices':
          const invoicesResp = await getInvoicesApi({ customer: user.contactId, limit: 50 });
          setInvoices(invoicesResp.data || []);
          break;
        case 'bills':
          const billsResp = await getBillsApi({ vendor: user.contactId, limit: 50 });
          setBills(billsResp.data || []);
          break;
        case 'payments':
          const paymentsResp = await getPaymentsApi({ contact: user.contactId, limit: 50 });
          setPayments(paymentsResp.data || []);
          break;
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balanceAmount);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedInvoice || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      await createPaymentApi({
        amount: paymentAmount,
        type: 'Received',
        paymentMethod: paymentMethod,
        document: selectedInvoice._id,
        contactId: user?.contactId
      });

      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);
      loadData(); // Refresh data
    } catch (error: any) {
      toast.error(error?.message || 'Failed to record payment');
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    // TODO: Implement PDF download
    toast('Download functionality coming soon!');
  };

  const handleViewInvoice = (invoiceId: string) => {
    // TODO: Implement invoice viewing
    toast('Invoice viewing functionality coming soon!');
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const TabButton: React.FC<{ tab: string; icon: React.ReactNode; label: string; count: number }> = ({ tab, icon, label, count }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === tab
          ? 'bg-primary-100 text-primary-700 border border-primary-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">{count}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
            <p className="text-gray-600 mt-1">View your invoices, bills, and payment history</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="font-semibold text-gray-900">Contact User</p>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex space-x-4">
            <TabButton
              tab="invoices"
              icon={<FileText className="h-4 w-4" />}
              label="My Invoices"
              count={invoices.length}
            />
            <TabButton
              tab="bills"
              icon={<FileText className="h-4 w-4" />}
              label="My Bills"
              count={bills.length}
            />
            <TabButton
              tab="payments"
              icon={<CreditCard className="h-4 w-4" />}
              label="Payment History"
              count={payments.length}
            />
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Loading...
              </div>
            </div>
          ) : (
            <>
              {/* Invoices Tab */}
              {activeTab === 'invoices' && (
                <div className="space-y-4">
                  {invoices.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No invoices found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {invoices.map((invoice) => (
                            <tr key={invoice._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {invoice.invoiceNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(invoice.invoiceDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(invoice.dueDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {formatCurrency(invoice.totalAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {formatCurrency(invoice.balanceAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleViewInvoice(invoice._id)}
                                    className="text-primary-600 hover:text-primary-900"
                                    title="View Invoice"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadInvoice(invoice._id)}
                                    className="text-gray-600 hover:text-gray-900"
                                    title="Download PDF"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                  {invoice.balanceAmount > 0 && (
                                    <button
                                      onClick={() => handleMakePayment(invoice)}
                                      className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                                      title="Make Payment"
                                    >
                                      <Plus className="h-4 w-4" />
                                      <span className="text-xs">Pay</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Bills Tab */}
              {activeTab === 'bills' && (
                <div className="space-y-4">
                  {bills.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No bills found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {bills.map((bill) => (
                            <tr key={bill._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {bill.billNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(bill.billDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(bill.dueDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {formatCurrency(bill.totalAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {formatCurrency(bill.balanceAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                                  {bill.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleViewInvoice(bill._id)}
                                    className="text-primary-600 hover:text-primary-900"
                                    title="View Bill"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadInvoice(bill._id)}
                                    className="text-gray-600 hover:text-gray-900"
                                    title="Download PDF"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                  {bill.balanceAmount > 0 && (
                                    <button
                                      onClick={() => handleMakePayment(bill as any)}
                                      className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                                      title="Make Payment"
                                    >
                                      <Plus className="h-4 w-4" />
                                      <span className="text-xs">Pay</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No payments found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payments.map((payment) => (
                            <tr key={payment._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {payment.paymentNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(payment.paymentDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  payment.type === 'Received' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {payment.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {payment.paymentMethod}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {payment.documentNumber || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Make Payment</h3>
              <form onSubmit={(e) => { e.preventDefault(); handlePaymentSubmit(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md">
                    <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">
                      Balance: {formatCurrency(selectedInvoice.balanceAmount)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Amount</label>
                  <input
                    type="number"
                    min="0.01"
                    max={selectedInvoice.balanceAmount}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="input mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="input mt-1"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="btn btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-md"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Make Payment'}
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

export default ContactPortal;
