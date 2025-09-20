import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { BarChart3, Download, Calendar } from 'lucide-react';

const BalanceSheet: React.FC = () => {
  const { getBalanceSheet } = useData();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  
  const balanceSheet = getBalanceSheet();

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting Balance Sheet...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time balance sheet as of {new Date(asOfDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="input"
            />
          </div>
          <button
            onClick={handleExport}
            className="btn btn-primary btn-md"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 bg-green-50 border-b border-green-200">
            <h3 className="text-lg font-medium text-green-900">ASSETS</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Assets</h4>
                <div className="space-y-2">
                  {balanceSheet.assets.currentAssets.map((asset) => (
                    <div key={asset.id} className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">{asset.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        ₹{asset.balance.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-sm text-gray-700">Total Current Assets</span>
                      <span className="text-sm text-gray-900">
                        ₹{balanceSheet.assets.totalCurrentAssets.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fixed Assets</h4>
                <div className="space-y-2">
                  {balanceSheet.assets.fixedAssets.map((asset) => (
                    <div key={asset.id} className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">{asset.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        ₹{asset.balance.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-sm text-gray-700">Total Fixed Assets</span>
                      <span className="text-sm text-gray-900">
                        ₹{balanceSheet.assets.totalFixedAssets.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold text-green-700">
                  <span>TOTAL ASSETS</span>
                  <span>₹{balanceSheet.assets.totalAssets.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <h3 className="text-lg font-medium text-red-900">LIABILITIES & EQUITY</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Liabilities</h4>
                <div className="space-y-2">
                  {balanceSheet.liabilities.currentLiabilities.map((liability) => (
                    <div key={liability.id} className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">{liability.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        ₹{liability.balance.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-sm text-gray-700">Total Current Liabilities</span>
                      <span className="text-sm text-gray-900">
                        ₹{balanceSheet.liabilities.totalCurrentLiabilities.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Long-term Liabilities</h4>
                <div className="space-y-2">
                  {balanceSheet.liabilities.longTermLiabilities.map((liability) => (
                    <div key={liability.id} className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">{liability.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        ₹{liability.balance.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-sm text-gray-700">Total Long-term Liabilities</span>
                      <span className="text-sm text-gray-900">
                        ₹{balanceSheet.liabilities.totalLongTermLiabilities.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Equity</h4>
                <div className="space-y-2">
                  {balanceSheet.equity.accounts.map((equity) => (
                    <div key={equity.id} className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">{equity.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        ₹{equity.balance.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-sm text-gray-700">Total Equity</span>
                      <span className="text-sm text-gray-900">
                        ₹{balanceSheet.equity.totalEquity.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold text-red-700">
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span>₹{balanceSheet.totalLiabilitiesAndEquity.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Check */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Balance Check</h3>
            <p className={`text-sm ${
              Math.abs(balanceSheet.assets.totalAssets - balanceSheet.totalLiabilitiesAndEquity) < 0.01
                ? 'text-green-600' : 'text-red-600'
            }`}>
              {Math.abs(balanceSheet.assets.totalAssets - balanceSheet.totalLiabilitiesAndEquity) < 0.01
                ? '✓ Assets = Liabilities + Equity (Balanced)'
                : '✗ Assets ≠ Liabilities + Equity (Not Balanced)'
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Difference: ₹{Math.abs(balanceSheet.assets.totalAssets - balanceSheet.totalLiabilitiesAndEquity).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
