import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthDebug: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('shiv-accounts-token');
  const storedUser = localStorage.getItem('shiv-accounts-user');

  const handleForceRelogin = () => {
    logout();
    navigate('/login');
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm">
      <div className="font-bold mb-2">🔍 Auth Debug</div>
      <div>
        <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
      </div>
      <div>
        <strong>User in Context:</strong> {user ? `${user.name} (${user.role})` : 'None'}
      </div>
      <div>
        <strong>Token in Storage:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}
      </div>
      <div>
        <strong>User in Storage:</strong> {storedUser ? 'Present' : 'None'}
      </div>
      {storedUser && (
        <div className="mt-2 text-xs opacity-75">
          <strong>Stored User:</strong> {JSON.parse(storedUser).name}
        </div>
      )}
      {!token && user && (
        <div className="mt-2">
          <button 
            onClick={handleForceRelogin}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
          >
            🔄 Force Re-login
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthDebug;
