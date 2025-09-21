import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, X } from 'lucide-react';
import { searchHSNApi, validateHSNApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface HSNCode {
  code: string;
  description: string;
  taxRate?: number;
}

interface HSNCodeSearchProps {
  value: string;
  onChange: (code: string, description?: string) => void;
  placeholder?: string;
  className?: string;
}

const HSNCodeSearch: React.FC<HSNCodeSearchProps> = ({
  value,
  onChange,
  placeholder = "Search HSN Code...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<HSNCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(value);
    if (value) {
      validateHSN(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateHSN = async (code: string) => {
    if (!code || code.length < 4) {
      setIsValid(null);
      return;
    }

    try {
      const response = await validateHSNApi(code);
      setIsValid(response.success);
    } catch (error) {
      setIsValid(false);
    }
  };

  const searchHSN = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchHSNApi(query);
      setSuggestions(response.data.hsnCodes || []);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to search HSN codes');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    
    if (newValue !== value) {
      setIsValid(null);
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchHSN(newValue);
      if (newValue) {
        validateHSN(newValue);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSuggestionClick = (hsn: HSNCode) => {
    setSearchTerm(hsn.code);
    onChange(hsn.code, hsn.description);
    setIsOpen(false);
    setIsValid(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchTerm && suggestions.length === 0) {
      searchHSN(searchTerm);
    }
  };

  const getValidationIcon = () => {
    if (isValid === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    } else if (isValid === false) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  // Common HSN codes for quick access
  const commonHSNCodes = [
    { code: '9401', description: 'Seats (other than those of heading 9402), whether or not convertible into beds' },
    { code: '9403', description: 'Other furniture and parts thereof' },
    { code: '9404', description: 'Mattress supports; articles of bedding and similar furnishing' },
    { code: '4421', description: 'Other articles of wood' },
    { code: '7326', description: 'Other articles of iron or steel' },
  ];

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`input pr-10 ${
            isValid === true ? 'border-green-300 focus:border-green-500' :
            isValid === false ? 'border-red-300 focus:border-red-500' : ''
          }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          ) : getValidationIcon() || (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Common HSN Codes */}
          {!searchTerm && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">Common HSN Codes</div>
              {commonHSNCodes.map((hsn) => (
                <button
                  key={hsn.code}
                  onClick={() => handleSuggestionClick(hsn)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                >
                  <div className="font-medium text-gray-900">{hsn.code}</div>
                  <div className="text-gray-600 text-xs truncate">{hsn.description}</div>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {suggestions.length > 0 && (
            <div className="p-2">
              {searchTerm && (
                <div className="text-xs font-medium text-gray-500 mb-2 px-2">Search Results</div>
              )}
              {suggestions.map((hsn) => (
                <button
                  key={hsn.code}
                  onClick={() => handleSuggestionClick(hsn)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                >
                  <div className="font-medium text-gray-900">{hsn.code}</div>
                  <div className="text-gray-600 text-xs truncate">{hsn.description}</div>
                  {hsn.taxRate && (
                    <div className="text-blue-600 text-xs">Tax Rate: {hsn.taxRate}%</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchTerm && suggestions.length === 0 && !loading && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No HSN codes found for "{searchTerm}"
            </div>
          )}

          {/* Manual Entry Option */}
          {searchTerm && searchTerm.length >= 4 && (
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={() => {
                  onChange(searchTerm);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-blue-600"
              >
                Use "{searchTerm}" as HSN code
              </button>
            </div>
          )}
        </div>
      )}

      {/* Validation Message */}
      {isValid === false && searchTerm && (
        <div className="mt-1 text-xs text-red-600">
          Invalid HSN code. Please check and try again.
        </div>
      )}
      {isValid === true && (
        <div className="mt-1 text-xs text-green-600">
          Valid HSN code
        </div>
      )}
    </div>
  );
};

export default HSNCodeSearch;
