import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Contact } from '../../types';
import { Plus, Edit, Trash2, Search, Filter, User, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { getContactsApi, createContactApi, updateContactApi, deleteContactApi, registerApi } from '../../lib/api';
import FileUpload from '../Common/FileUpload';
import { useLocation } from 'react-router-dom';

const ContactMaster: React.FC = () => {
  const { contacts: ctxContacts, addContact, updateContact, deleteContact } = useData();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>(ctxContacts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Customer' | 'Vendor' | 'Both'>('All');

  const [formData, setFormData] = useState({
    name: '',
    type: 'Customer' as 'Customer' | 'Vendor' | 'Both',
    email: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    profileImage: '',
    balance: 0,
    createUser: false,
    userPassword: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.mobile.includes(searchTerm);
    const matchesFilter = filterType === 'All' || contact.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Load contacts
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await getContactsApi({ limit: 100 });
        if (resp?.data?.contacts) {
          const mapped = resp.data.contacts.map((c: any) => ({
            id: c._id,
            name: c.name,
            type: c.type,
            email: c.email,
            mobile: c.mobile,
            address: c.address || '',
            city: c.city || '',
            state: c.state || '',
            pincode: c.pincode || '',
            profileImage: c.profileImage || '',
            balance: c.currentBalance ?? 0,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt)
          })) as Contact[];
          setContacts(mapped);
        }
      } catch (err: any) {
        setContacts(ctxContacts);
        toast.error(err?.message || 'Failed to load contacts. Using local data.');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open modal if ?open=1 in query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('open') === '1') {
      handleOpenModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        type: contact.type,
        email: contact.email,
        mobile: contact.mobile,
        address: contact.address,
        city: contact.city,
        state: contact.state,
        pincode: contact.pincode,
        profileImage: contact.profileImage || '',
        balance: contact.balance
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        type: 'Customer',
        email: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        profileImage: '',
        balance: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    setFormData({
      name: '',
      type: 'Customer',
      email: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      profileImage: '',
      balance: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingContact) {
        try {
          await updateContactApi(editingContact.id, {
            name: formData.name,
            type: formData.type,
            email: formData.email,
            mobile: formData.mobile,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          });
        } catch {
          updateContact(editingContact.id, formData);
        }
        setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...formData } as Contact : c));
        toast.success('Contact updated successfully!');
      } else {
        try {
          const resp = await createContactApi({
            name: formData.name,
            type: formData.type,
            email: formData.email,
            mobile: formData.mobile,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          });
          const c = (resp as any).data;
          setContacts(prev => [
            ...prev,
            {
              id: c._id,
              name: c.name,
              type: c.type,
              email: c.email,
              mobile: c.mobile,
              address: c.address || '',
              city: c.city || '',
              state: c.state || '',
              pincode: c.pincode || '',
              profileImage: c.profileImage || '',
              balance: c.currentBalance ?? 0,
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt)
            } as Contact
          ]);
        } catch {
          addContact(formData);
          setContacts(prev => [...prev, { ...formData, id: Math.random().toString(36), createdAt: new Date(), updatedAt: new Date() } as Contact]);
        }
        toast.success('Contact added successfully!');
      }
    } finally {
      setLoading(false);
      handleCloseModal();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      setLoading(true);
      try {
        await deleteContactApi(id);
      } catch {
        deleteContact(id);
      }
      setContacts(prev => prev.filter(c => c.id !== id));
      toast.success('Contact deleted successfully!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Master</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your customers and vendors
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
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
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input"
            >
              <option value="All">All Types</option>
              <option value="Customer">Customer</option>
              <option value="Vendor">Vendor</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-header-row">
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Email</th>
                <th className="table-header-cell">Mobile</th>
                <th className="table-header-cell">City</th>
                <th className="table-header-cell">Balance</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {(loading ? [] : filteredContacts).map((contact) => (
                <tr key={contact.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      contact.type === 'Customer' ? 'bg-green-100 text-green-800' :
                      contact.type === 'Vendor' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {contact.type}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-gray-900">{contact.email}</td>
                  <td className="table-cell text-sm text-gray-900">{contact.mobile}</td>
                  <td className="table-cell text-sm text-gray-900">{contact.city}</td>
                  <td className="table-cell">
                    <span className={`text-sm font-medium ${
                      contact.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{contact.balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(contact)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!loading && filteredContacts.length === 0) && (
                <tr>
                  <td className="table-cell text-center py-12" colSpan={7}>
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      <div className="text-sm">No contacts found. Try adjusting your filters or add a new contact.</div>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="table-cell text-center py-8" colSpan={7}>
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Loading contacts...
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
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
                    <option value="Customer">Customer</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="input mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="input mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="input mt-1"
                  />
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
                    {editingContact ? 'Update' : 'Add'} Contact
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

export default ContactMaster;
