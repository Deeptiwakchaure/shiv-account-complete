import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, Package, FileText, Receipt } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'contact' | 'product' | 'invoice' | 'bill' | 'order';
  route: string;
  icon: React.ReactNode;
}

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const { contacts, products, customerInvoices, vendorBills, salesOrders, purchaseOrders } = useData();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search contacts
    contacts
      .filter(contact => 
        contact.name.toLowerCase().includes(lowerQuery) ||
        contact.email.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach(contact => {
        searchResults.push({
          id: contact.id,
          title: contact.name,
          subtitle: `${contact.type} - ${contact.email}`,
          type: 'contact',
          route: '/masters/contacts',
          icon: <Users className="h-4 w-4 text-blue-500" />
        });
      });

    // Search products
    products
      .filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.hsnCode.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach(product => {
        searchResults.push({
          id: product.id,
          title: product.name,
          subtitle: `${product.category} - ₹${product.salesPrice}`,
          type: 'product',
          route: '/masters/products',
          icon: <Package className="h-4 w-4 text-green-500" />
        });
      });

    // Search sales orders
    salesOrders
      .filter(so => 
        so.customer?.name?.toLowerCase().includes(lowerQuery) ||
        (so as any).orderNumber?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 2)
      .forEach(so => {
        searchResults.push({
          id: so.id,
          title: `SO-${so.id.slice(-6)}`,
          subtitle: `${so.customer?.name} - ₹${so.grandTotal?.toLocaleString()}`,
          type: 'order',
          route: '/transactions/sales-orders',
          icon: <FileText className="h-4 w-4 text-purple-500" />
        });
      });

    // Search customer invoices
    customerInvoices
      .filter(invoice => 
        invoice.customer?.name?.toLowerCase().includes(lowerQuery) ||
        (invoice as any).invoiceNumber?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 2)
      .forEach(invoice => {
        searchResults.push({
          id: invoice.id,
          title: `INV-${invoice.id.slice(-6)}`,
          subtitle: `${invoice.customer?.name} - ₹${invoice.grandTotal?.toLocaleString()}`,
          type: 'invoice',
          route: '/transactions/customer-invoices',
          icon: <Receipt className="h-4 w-4 text-emerald-500" />
        });
      });

    setResults(searchResults.slice(0, 8));
    setSelectedIndex(0);
  }, [query, contacts, products, customerInvoices, vendorBills, salesOrders, purchaseOrders]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.route);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center p-4 pt-16">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" onClick={() => setIsOpen(false)} />
        
        <div ref={searchRef} className="relative w-full max-w-lg transform rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search contacts, products, orders..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-0 bg-transparent text-gray-900 placeholder-gray-500 focus:ring-0 focus:outline-none"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="ml-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {results.length > 0 && (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mr-3">
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {result.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No results found for "{query}"</p>
            </div>
          )}

          {!query && (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Start typing to search across all modules</p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Search contacts, products, orders, invoices, and more</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
