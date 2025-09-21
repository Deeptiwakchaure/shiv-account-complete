import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Product } from '../../types';
import { Plus, Edit, Trash2, Search, Package, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { getProductsApi, createProductApi, updateProductApi, deleteProductApi, searchHSNApi } from '../../lib/api';
import { useLocation } from 'react-router-dom';

const ProductMaster: React.FC = () => {
  const { products: ctxProducts, addProduct, updateProduct, deleteProduct } = useData();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>(ctxProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Goods' | 'Service'>('All');

  const [formData, setFormData] = useState({
    name: '',
    type: 'Goods' as 'Goods' | 'Service',
    category: '',
    unit: 'PCS' as 'PCS' | 'KG' | 'LTR' | 'MTR' | 'SFT' | 'CBM' | 'BOX' | 'SET' | 'PAIR' | 'DOZEN' | 'HOUR' | 'DAY' | 'MONTH' | 'YEAR',
    salesPrice: 0,
    purchasePrice: 0,
    salesTaxPercent: 0,
    purchaseTaxPercent: 0,
    hsnCode: '',
    stock: 0
  });

  // HSN Search States
  const [isHsnModalOpen, setIsHsnModalOpen] = useState(false);
  const [hsnSearchTerm, setHsnSearchTerm] = useState('');
  const [hsnSearchResults, setHsnSearchResults] = useState<any[]>([]);
  const [hsnLoading, setHsnLoading] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.hsnCode.includes(searchTerm);
    const matchesFilter = filterType === 'All' || product.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (stock <= 5) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    if (stock <= 10) return { status: 'Medium Stock', color: 'text-orange-600 bg-orange-100' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  const getStockStatusBadge = (stock: number) => {
    const { status, color } = getStockStatus(stock);
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
        {status}
      </span>
    );
  };

  // Load products from backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await getProductsApi({ limit: 100 });
        if (resp?.data?.products) {
          const mapped = resp.data.products.map((p: any) => ({
            id: p._id,
            name: p.name,
            type: p.type,
            category: p.category,
            hsnCode: p.hsnCode,
            salesPrice: p.salesPrice,
            purchasePrice: p.purchasePrice,
            salesTaxPercent: p.salesTaxPercent || 0,
            purchaseTaxPercent: p.purchaseTaxPercent || 0,
            stock: p.currentStock || 0,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt)
          })) as Product[];
          setProducts(mapped);
        }
      } catch (err: any) {
        setProducts(ctxProducts);
        toast.error(err?.message || 'Failed to load products. Using local data.');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open modal if ?open=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('open') === '1') {
      handleOpenModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        type: product.type,
        category: product.category,
        unit: 'PCS',
        salesPrice: product.salesPrice,
        purchasePrice: product.purchasePrice,
        salesTaxPercent: product.salesTaxPercent,
        purchaseTaxPercent: product.purchaseTaxPercent,
        hsnCode: product.hsnCode,
        stock: product.stock
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        type: 'Goods',
        category: '',
        unit: 'PCS',
        salesPrice: 0,
        purchasePrice: 0,
        salesTaxPercent: 0,
        purchaseTaxPercent: 0,
        hsnCode: '',
        stock: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      type: 'Goods',
      category: '',
      unit: 'PCS',
      salesPrice: 0,
      purchasePrice: 0,
      salesTaxPercent: 0,
      purchaseTaxPercent: 0,
      hsnCode: '',
      stock: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingProduct) {
        try {
          await updateProductApi(editingProduct.id, {
            name: formData.name,
            type: formData.type,
            category: formData.category,
            hsnCode: formData.hsnCode,
            unit: formData.unit,
            salesPrice: formData.salesPrice,
            purchasePrice: formData.purchasePrice,
            salesTaxPercent: formData.salesTaxPercent,
            purchaseTaxPercent: formData.purchaseTaxPercent,
          });
        } catch {
          updateProduct(editingProduct.id, formData);
        }
        // Update local list
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...formData } as Product : p));
        toast.success('Product updated successfully!');
      } else {
        try {
          const resp = await createProductApi({
            name: formData.name,
            type: formData.type,
            category: formData.category,
            hsnCode: formData.hsnCode,
            unit: formData.unit,
            salesPrice: formData.salesPrice,
            purchasePrice: formData.purchasePrice,
            salesTaxPercent: formData.salesTaxPercent,
            purchaseTaxPercent: formData.purchaseTaxPercent,
            openingStock: formData.stock,
          });
          const p = (resp as any).data.product;
          setProducts(prev => [
            ...prev,
            {
              id: p._id,
              name: p.name,
              type: p.type,
              category: p.category,
              hsnCode: p.hsnCode,
              salesPrice: p.salesPrice,
              purchasePrice: p.purchasePrice,
              salesTaxPercent: p.salesTaxPercent || 0,
              purchaseTaxPercent: p.purchaseTaxPercent || 0,
              stock: p.currentStock || 0,
              createdAt: new Date(p.createdAt),
              updatedAt: new Date(p.updatedAt)
            } as Product
          ]);
        } catch {
          addProduct(formData);
          setProducts(prev => [...prev, { ...formData, id: Math.random().toString(36), createdAt: new Date(), updatedAt: new Date() } as Product]);
        }
        toast.success('Product added successfully!');
      }
    } finally {
      setLoading(false);
      handleCloseModal();
    }
  };

  const handleHsnSearch = async () => {
    if (!hsnSearchTerm.trim() || hsnSearchTerm.length < 2) {
      toast.error('Please enter at least 2 characters to search HSN codes');
      return;
    }

    setHsnLoading(true);
    try {
      const response = await searchHSNApi(hsnSearchTerm.trim());
      if (response.success && response.data?.hsnCodes) {
        setHsnSearchResults(response.data.hsnCodes);
      } else {
        setHsnSearchResults([]);
        toast.error('No HSN codes found for the search term');
      }
    } catch (error: any) {
      console.error('HSN search error:', error);
      toast.error(error?.message || 'Failed to search HSN codes');
      setHsnSearchResults([]);
    } finally {
      setHsnLoading(false);
    }
  };

  const handleHsnSelect = (hsn: any) => {
    const code = hsn.code || hsn.c || '';
    const description = hsn.description || hsn.n || '';
    setFormData(prev => ({
      ...prev,
      hsnCode: code
    }));
    setIsHsnModalOpen(false);
    setHsnSearchTerm('');
    setHsnSearchResults([]);
    toast.success(`HSN Code ${code} selected: ${description}`);
  };

  const openHsnModal = () => {
    setIsHsnModalOpen(true);
    setHsnSearchTerm('');
    setHsnSearchResults([]);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      setLoading(true);
      try {
        await deleteProductApi(id);
      } catch {
        deleteProduct(id);
      }
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted successfully!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Master</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your products and services
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
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
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input"
            >
              <option value="All">All Types</option>
              <option value="Goods">Goods</option>
              <option value="Service">Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-header-row">
                <th className="table-header-cell">Product</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Sales Price</th>
                <th className="table-header-cell">Purchase Price</th>
                <th className="table-header-cell">Stock</th>
                <th className="table-header-cell">HSN Code</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {(loading ? [] : filteredProducts).map((product) => (
                <tr key={product.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">Tax: {product.salesTaxPercent}%</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.type === 'Goods' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {product.type}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-gray-900">{product.category}</td>
                  <td className="table-cell text-sm text-gray-900">₹{product.salesPrice.toLocaleString()}</td>
                  <td className="table-cell text-sm text-gray-900">₹{product.purchasePrice.toLocaleString()}</td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{product.stock} units</span>
                      {getStockStatusBadge(product.stock)}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td className="table-cell text-center py-8" colSpan={8}>
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Loading products...
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="input mt-1"
                    >
                      <option value="Goods">Goods</option>
                      <option value="Service">Service</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                      className="input mt-1"
                    >
                      {['PCS','KG','LTR','MTR','SFT','CBM','BOX','SET','PAIR','DOZEN','HOUR','DAY','MONTH','YEAR'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category *</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">HSN Code *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formData.hsnCode}
                        onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                        className="input mt-1 flex-1"
                        placeholder="Enter or search HSN code"
                      />
                      <button
                        type="button"
                        onClick={openHsnModal}
                        className="btn btn-secondary btn-md mt-1"
                        title="Search HSN Codes"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Click search to find HSN codes from GST database</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sales Price *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.salesPrice}
                      onChange={(e) => setFormData({ ...formData, salesPrice: parseFloat(e.target.value) || 0 })}
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Price *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                      className="input mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sales Tax %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.salesTaxPercent}
                      onChange={(e) => setFormData({ ...formData, salesTaxPercent: parseFloat(e.target.value) || 0 })}
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Tax %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.purchaseTaxPercent}
                      onChange={(e) => setFormData({ ...formData, purchaseTaxPercent: parseFloat(e.target.value) || 0 })}
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      className="input mt-1"
                    />
                  </div>
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
                    {editingProduct ? 'Update' : 'Add'} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* HSN Search Modal */}
      {isHsnModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Search HSN Codes</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search by code or description (min 2 characters)..."
                  value={hsnSearchTerm}
                  onChange={(e) => setHsnSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleHsnSearch()}
                  className="input flex-1"
                />
                <button
                  onClick={handleHsnSearch}
                  disabled={hsnLoading || !hsnSearchTerm.trim() || hsnSearchTerm.length < 2}
                  className="btn btn-primary btn-md"
                >
                  {hsnLoading ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {hsnSearchResults.length > 0 ? (
                  <div className="space-y-2">
                    {hsnSearchResults.map((hsn, index) => (
                      <div
                        key={index}
                        onClick={() => handleHsnSelect(hsn)}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {hsn.code || hsn.c}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {hsn.description || hsn.n}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hsnLoading ? (
                  <div className="text-center py-8">
                    <svg className="animate-spin h-6 w-6 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <p className="text-gray-600 mt-2">Searching HSN codes...</p>
                  </div>
                ) : hsnSearchTerm.length >= 2 ? (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No HSN codes found</p>
                    <p className="text-sm text-gray-500">Try a different search term</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Enter a search term to find HSN codes</p>
                    <p className="text-sm text-gray-500">Search by code (e.g., 9401) or description (e.g., furniture)</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsHsnModalOpen(false)}
                  className="btn btn-secondary btn-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMaster;
