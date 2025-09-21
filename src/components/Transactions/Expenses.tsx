import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Search, Filter, Edit2, Trash2, Eye, Download, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getExpensesApi, createExpenseApi, updateExpenseApi, updateExpenseStatusApi, deleteExpenseApi } from '../../lib/api';

interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank' | 'Credit Card';
  vendor?: {
    id: string;
    name: string;
  };
  account: {
    id: string;
    name: string;
  };
  receipt?: string;
  status: 'Draft' | 'Approved' | 'Paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const Expenses: React.FC = () => {
  const { contacts, accounts } = useData();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    description: '',
    amount: '',
    paymentMethod: 'Cash' as 'Cash' | 'Bank' | 'Credit Card',
    vendorId: '',
    accountId: '',
    notes: ''
  });

  const categories = [
    'Office Supplies',
    'Travel & Transportation',
    'Utilities',
    'Marketing & Advertising',
    'Professional Services',
    'Equipment & Software',
    'Rent & Facilities',
    'Insurance',
    'Meals & Entertainment',
    'Other'
  ];

  const vendors = contacts.filter(c => c.type === 'Vendor' || c.type === 'Both');
  const expenseAccounts = accounts.filter(a => a.type === 'Expense');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const response = await getExpensesApi({ limit: 100 });
      if (response.success && response.data) {
        const mappedExpenses = response.data.map((exp: any) => ({
          id: exp._id,
          expenseNumber: exp.expenseNumber,
          date: exp.date,
          category: exp.category,
          description: exp.description,
          amount: exp.amount,
          paymentMethod: exp.paymentMethod,
          vendor: exp.vendor ? { id: exp.vendor._id, name: exp.vendor.name } : undefined,
          account: { id: exp.account._id, name: exp.account.name },
          status: exp.status,
          notes: exp.notes,
          createdAt: exp.createdAt,
          updatedAt: exp.updatedAt
        }));
        setExpenses(mappedExpenses);
      }
    } catch (error: any) {
      console.error('Load expenses error:', error);
      toast.error(error?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expenseData = {
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        vendorId: formData.vendorId || undefined,
        accountId: formData.accountId,
        notes: formData.notes
      };

      if (editingExpense) {
        // Update expense
        const response = await updateExpenseApi(editingExpense.id, expenseData);
        if (response.success) {
          await loadExpenses(); // Reload to get updated data
          toast.success('Expense updated successfully');
        }
      } else {
        // Create new expense
        const response = await createExpenseApi(expenseData);
        if (response.success) {
          await loadExpenses(); // Reload to get new data
          toast.success('Expense created successfully');
        }
      }

      resetForm();
    } catch (error: any) {
      console.error('Save expense error:', error);
      toast.error(error?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      description: '',
      amount: '',
      paymentMethod: 'Cash' as 'Cash' | 'Bank' | 'Credit Card',
      vendorId: '',
      accountId: '',
      notes: ''
    });
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      vendorId: expense.vendor?.id || '',
      accountId: expense.account.id,
      notes: expense.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      setLoading(true);
      const response = await deleteExpenseApi(id);
      if (response.success) {
        await loadExpenses(); // Reload to get updated data
        toast.success('Expense deleted successfully');
      }
    } catch (error: any) {
      console.error('Delete expense error:', error);
      toast.error(error?.message || 'Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: Expense['status']) => {
    try {
      setLoading(true);
      const response = await updateExpenseStatusApi(id, status);
      if (response.success) {
        await loadExpenses(); // Reload to get updated data
        toast.success(`Expense ${status.toLowerCase()} successfully`);
      }
    } catch (error: any) {
      console.error('Update expense status error:', error);
      toast.error(error?.message || 'Failed to update expense status');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || expense.status === statusFilter;
    const matchesCategory = !categoryFilter || expense.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Track and manage business expenses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalExpenses.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">₹{(totalExpenses * 0.3).toLocaleString()}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{expenses.filter(e => e.status === 'Draft').length}</p>
            </div>
            <Eye className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(expenses.map(e => e.category)).size}</p>
            </div>
            <Filter className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter expense description"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor (Optional)</label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendorId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expense Account</label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Account</option>
                    {expenseAccounts.map(account => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingExpense ? 'Update' : 'Create'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{expense.expenseNumber}</div>
                      <div className="text-sm text-gray-500">{expense.description}</div>
                      <div className="text-xs text-gray-400">{format(new Date(expense.date), 'MMM dd, yyyy')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{expense.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={expense.status}
                      onChange={(e) => handleStatusChange(expense.id, e.target.value as Expense['status'])}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${
                        expense.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                        expense.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Approved">Approved</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new expense.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;