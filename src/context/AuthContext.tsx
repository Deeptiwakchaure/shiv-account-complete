import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { useData } from './DataContext';
import { loginApi } from '../lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users } = useData();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Restore session from localStorage (token + user)
    const storedUser = localStorage.getItem('shiv-accounts-user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('shiv-accounts-user');
        localStorage.removeItem('shiv-accounts-token');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Prefer backend auth
      const { user: backendUser, token } = await loginApi(email, password);
      if (token && backendUser) {
        localStorage.setItem('shiv-accounts-token', token);
        localStorage.setItem('shiv-accounts-user', JSON.stringify(backendUser));
        setUser(backendUser as User);
        return true;
      }
      return false;
    } catch (err) {
      // Fallback to mock users only if backend unavailable
      const foundUser = users.find(u => u.email === email && u.password === password);
      if (foundUser) {
        const { password: _pw, ...userWithoutPassword } = foundUser as any;
        setUser(userWithoutPassword as User);
        localStorage.setItem('shiv-accounts-user', JSON.stringify(userWithoutPassword));
        // No token in mock fallback
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shiv-accounts-user');
    localStorage.removeItem('shiv-accounts-token');
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
