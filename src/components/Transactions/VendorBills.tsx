import React from 'react';
import { FileText } from 'lucide-react';

const VendorBills: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Bills</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage vendor bills and payments
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vendor Bills Module</h3>
        <p className="text-gray-500">This module will be implemented to manage vendor bills and payments.</p>
      </div>
    </div>
  );
};

export default VendorBills;
