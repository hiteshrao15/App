import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STORE_OWNER';
  storeId?: string;
  storeName?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (phoneOrEmail: string, passOrOtp: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('bb_admin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default logged-in admin user for frictionless dev preview
    return {
      id: 'usr-admin-1',
      name: 'Aditya Singhania',
      email: 'admin@bottlebazaar.in',
      role: 'ADMIN',
      storeName: 'BottleBazaar Headquarters (Mumbai)',
    };
  });

  const login = async (phoneOrEmail: string, passOrOtp: string): Promise<boolean> => {
    // Development authentication
    const mockUser: AdminUser = {
      id: `usr-${Date.now()}`,
      name: phoneOrEmail.includes('@') ? phoneOrEmail.split('@')[0] : 'Store Manager',
      email: phoneOrEmail.includes('@') ? phoneOrEmail : `${phoneOrEmail}@merchant.bottlebazaar.in`,
      role: phoneOrEmail.toLowerCase().includes('admin') ? 'ADMIN' : 'STORE_OWNER',
      storeName: 'Living Liquidz — Bandra West',
    };
    adminApi.setAuthToken(`mock-jwt-token-${Date.now()}`);
    setUser(mockUser);
    localStorage.setItem('bb_admin_user', JSON.stringify(mockUser));
    return true;
  };

  const logout = () => {
    adminApi.clearAuthToken();
    localStorage.removeItem('bb_admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
