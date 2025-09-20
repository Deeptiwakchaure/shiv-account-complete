import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// registerApi and loginApi are available but not used directly - handled by AuthContext
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Accountant' as 'Admin' | 'Accountant',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setLoading(true);
      // Register and login in one step
      const success = await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      if (success) {
        toast.success('Account created and logged in successfully!');
        navigate('/dashboard', { replace: true });
      } else {
        toast.error('Failed to create account or login');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}<Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">sign in to your account</Link>
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white p-6 rounded-xl shadow" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                className="input mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                className="input mt-1"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                className="input mt-1"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                className="input mt-1"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
              >
                <option value="Admin">Admin</option>
                <option value="Accountant">Accountant</option>
              </select>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="btn btn-primary btn-md w-full"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
