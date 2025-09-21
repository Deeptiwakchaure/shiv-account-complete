import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { loginApi, registerApi } from '../lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Restore session from localStorage (token + user)
    const storedUser = localStorage.getItem('shiv-accounts-user');
    const storedToken = localStorage.getItem('shiv-accounts-token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('shiv-accounts-user');
        localStorage.removeItem('shiv-accounts-token');
      }
    } else if (storedUser && !storedToken) {
      // User exists but no token - invalid state, clear everything
      console.log('[AuthContext] Invalid state: user without token, clearing session');
      localStorage.removeItem('shiv-accounts-user');
      localStorage.removeItem('shiv-accounts-token');
      setUser(null);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Only use backend auth - no fallback to mock users
      const { user: backendUser, token } = await loginApi(email, password);
      if (token && backendUser) {
        localStorage.setItem('shiv-accounts-token', token);
        localStorage.setItem('shiv-accounts-user', JSON.stringify(backendUser));
        setUser(backendUser as User);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[AuthContext] Login failed:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shiv-accounts-user');
    localStorage.removeItem('shiv-accounts-token');
  };

  const register = async (userData: { name: string; email: string; password: string; role?: string }): Promise<boolean> => {
    try {
      // Register the user
      await registerApi(userData);
      
      // Then login to set auth context with token
      return await login(userData.email, userData.password);
    } catch (err) {
      console.error('[AuthContext] Registration error:', err);
      return false;
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
