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
  requestOtp: (phone: string) => Promise<void>;
  login: (phone: string, otp: string) => Promise<boolean>;
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
    return null;
  });

  const requestOtp = async (phone: string): Promise<void> => {
    const response = await fetch('/api/v1/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.replace(/\s+/g, ''), countryCode: '+91' }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Could not send OTP.');
  };

  const login = async (phone: string, otp: string): Promise<boolean> => {
    const response = await fetch('/api/v1/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.replace(/\s+/g, ''), otp }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Invalid or expired OTP.');

    const role = body.user?.role;
    if (!['admin', 'super_admin', 'moderator', 'store_owner'].includes(role)) {
      throw new Error('This account is not authorized for the merchant portal.');
    }

    const authenticatedUser: AdminUser = {
      id: String(body.user.id),
      name: body.user.displayName || phone,
      email: '',
      role: role === 'store_owner' ? 'STORE_OWNER' : 'ADMIN',
    };
    adminApi.setAuthToken(String(body.token));
    setUser(authenticatedUser);
    localStorage.setItem('bb_admin_user', JSON.stringify(authenticatedUser));
    return true;
  };

  const logout = () => {
    adminApi.clearAuthToken();
    localStorage.removeItem('bb_admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, requestOtp, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
