import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Users, Download, Calendar, Search } from 'lucide-react';

const PartnerLedger: React.FC = () => {
  const { getPartnerLedger, contacts } = useData();
  const [selectedContactId, setSelectedContactId] = useState('');
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const customers = contacts.filter(c => c.type === 'Customer' || c.type === 'Both');
  const vendors = contacts.filter(c => c.type === 'Vendor' || c.type === 'Both');
  const allPartners = [...customers, ...vendors];

  const filteredPartners = allPartners.filter(partner => 
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting Partner Ledger...');
  };

  const generateLedger = () => {
    if (!selectedContactId) return null;
    
    try {
      return getPartnerLedger(selectedContactId, new Date(fromDate), new Date(toDate));
    } catch (error) {
      return null;
    }
  };

  const ledger = generateLedger();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Ledger</h1>
          <p className="mt-1 text-sm text-gray-500">
            Detailed transaction history with customers and vendors
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Partner</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Partner</label>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="input"
            >
              <option value="">Select a partner</option>
              {filteredPartners.map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.name} ({partner.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Partner Summary */}
      {ledger && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{ledger.contact.name}</h3>
                <p className="text-sm text-gray-500">{ledger.contact.email} • {ledger.contact.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className={`text-2xl font-bold ${
                ledger.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{ledger.closingBalance.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Opening Balance</p>
              <p className="text-lg font-semibold text-gray-900">
                ₹{ledger.openingBalance.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Debit</p>
              <p className="text-lg font-semibold text-green-600">
                ₹{ledger.totalDebit.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Credit</p>
              <p className="text-lg font-semibold text-blue-600">
                ₹{ledger.totalCredit.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Closing Balance</p>
              <p className={`text-lg font-semibold ${
                ledger.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{ledger.closingBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {ledger && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
            <p className="text-sm text-gray-500">
              From {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr className="table-header-row">
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Transaction Type</th>
                  <th className="table-header-cell">Description</th>
                  <th className="table-header-cell">Reference</th>
                  <th className="table-header-cell">Debit</th>
                  <th className="table-header-cell">Credit</th>
                  <th className="table-header-cell">Balance</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {ledger.transactions.length > 0 ? (
                  ledger.transactions.map((transaction) => (
                    <tr key={transaction.id} className="table-row">
                      <td className="table-cell text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.transactionType === 'Sales' ? 'bg-green-100 text-green-800' :
                          transaction.transactionType === 'Purchase' ? 'bg-blue-100 text-blue-800' :
                          transaction.transactionType === 'Payment' ? 'bg-yellow-100 text-yellow-800' :
                          transaction.transactionType === 'Receipt' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.transactionType}
                        </span>
                      </td>
                      <td className="table-cell text-sm text-gray-900">{transaction.description}</td>
                      <td className="table-cell text-sm text-gray-900">{transaction.reference || '-'}</td>
                      <td className="table-cell text-sm text-gray-900">
                        {transaction.debit > 0 ? `₹${transaction.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="table-cell text-sm text-gray-900">
                        {transaction.credit > 0 ? `₹${transaction.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="table-cell">
                        <span className={`text-sm font-medium ${
                          transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ₹{transaction.balance.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="table-row">
                    <td colSpan={7} className="table-cell text-center text-gray-500 py-8">
                      No transactions found for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Partner Selected */}
      {!ledger && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Partner</h3>
          <p className="text-gray-500">Choose a customer or vendor to view their transaction ledger.</p>
        </div>
      )}
    </div>
  );
};

export default PartnerLedger;
