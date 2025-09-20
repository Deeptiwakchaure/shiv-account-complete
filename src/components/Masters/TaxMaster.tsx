import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Tax } from '../../types';
import { Plus, Edit, Trash2, Search, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

const TaxMaster: React.FC = () => {
  const { taxes, addTax, updateTax, deleteTax } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterApplicable, setFilterApplicable] = useState<'All' | 'Sales' | 'Purchase' | 'Both'>('All');

  const [formData, setFormData] = useState({
    name: '',
    rate: 0,
    computationMethod: 'Percentage' as 'Percentage' | 'Fixed',
    applicableOn: 'Both' as 'Sales' | 'Purchase' | 'Both'
  });

  const filteredTaxes = taxes.filter(tax => {
    const matchesSearch = tax.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterApplicable === 'All' || tax.applicableOn === filterApplicable || tax.applicableOn === 'Both';
    return matchesSearch && matchesFilter;
  });

  const handleOpenModal = (tax?: Tax) => {
    if (tax) {
      setEditingTax(tax);
      setFormData({
        name: tax.name,
        rate: tax.rate,
        computationMethod: tax.computationMethod,
        applicableOn: tax.applicableOn
      });
    } else {
      setEditingTax(null);
      setFormData({
        name: '',
        rate: 0,
        computationMethod: 'Percentage',
        applicableOn: 'Both'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTax(null);
    setFormData({
      name: '',
      rate: 0,
      computationMethod: 'Percentage',
      applicableOn: 'Both'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTax) {
      updateTax(editingTax.id, formData);
      toast.success('Tax updated successfully!');
    } else {
      addTax(formData);
      toast.success('Tax added successfully!');
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tax?')) {
      deleteTax(id);
      toast.success('Tax deleted successfully!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Master</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage tax rules and rates
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tax
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
                placeholder="Search taxes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gray-400" />
            <select
              value={filterApplicable}
              onChange={(e) => setFilterApplicable(e.target.value as any)}
              className="input"
            >
              <option value="All">All Applicable</option>
              <option value="Sales">Sales</option>
              <option value="Purchase">Purchase</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>
      </div>

      {/* Taxes Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-header-row">
                <th className="table-header-cell">Tax Name</th>
                <th className="table-header-cell">Rate</th>
                <th className="table-header-cell">Method</th>
                <th className="table-header-cell">Applicable On</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredTaxes.map((tax) => (
                <tr key={tax.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{tax.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm font-medium text-gray-900">
                      {tax.computationMethod === 'Percentage' ? `${tax.rate}%` : `₹${tax.rate}`}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tax.computationMethod === 'Percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {tax.computationMethod}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tax.applicableOn === 'Sales' ? 'bg-green-100 text-green-800' :
                      tax.applicableOn === 'Purchase' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {tax.applicableOn}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(tax)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tax.id)}
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTax ? 'Edit Tax' : 'Add New Tax'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input mt-1"
                    placeholder="e.g., GST 5%, Service Tax"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rate *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                    className="input mt-1"
                    placeholder="Enter rate"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Computation Method *</label>
                  <select
                    value={formData.computationMethod}
                    onChange={(e) => setFormData({ ...formData, computationMethod: e.target.value as any })}
                    className="input mt-1"
                  >
                    <option value="Percentage">Percentage</option>
                    <option value="Fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Applicable On *</label>
                  <select
                    value={formData.applicableOn}
                    onChange={(e) => setFormData({ ...formData, applicableOn: e.target.value as any })}
                    className="input mt-1"
                  >
                    <option value="Sales">Sales Only</option>
                    <option value="Purchase">Purchase Only</option>
                    <option value="Both">Both Sales & Purchase</option>
                  </select>
                </div>

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
                    {editingTax ? 'Update' : 'Add'} Tax
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

export default TaxMaster;
