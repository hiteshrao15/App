// =====================================================
// Mobile Auth & Age Gate Declaration Context
// =====================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi } from '../services/api';

export interface MobileUser {
  id: string;
  phoneNumber: string;
  name?: string;
  ageDeclared: boolean;
  ageDeclaredDate?: string;
  birthYear?: number;
}

interface AuthContextType {
  user: MobileUser | null;
  isAuthenticated: boolean;
  isAgeVerified: boolean;
  confirmAge: (birthYear: number) => Promise<void>;
  requestOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedUser, savedAge] = await Promise.all([
          AsyncStorage.getItem('@bottlebazaar_user'),
          AsyncStorage.getItem('@bottlebazaar_age_declared'),
        ]);

        if (savedAge === 'true') {
          setIsAgeVerified(true);
        }
        if (savedUser) {
          try {
            const profile = await mobileApi.getProfile();
            setUser({
              id: profile.id,
              phoneNumber: profile.phone,
              name: profile.displayName,
              ageDeclared: profile.ageDeclared,
              ageDeclaredDate: profile.ageDeclaredAt,
            });
            setIsAgeVerified(profile.ageDeclared);
          } catch {
            await AsyncStorage.removeItem('@bottlebazaar_user');
            await AsyncStorage.removeItem('@bottlebazaar_access_token');
          }
        }
      } catch (e) {}
    })();
  }, []);

  const confirmAge = async (birthYear: number) => {
    setIsAgeVerified(true);
    await AsyncStorage.setItem('@bottlebazaar_age_declared', 'true');
    await AsyncStorage.setItem('@bottlebazaar_birth_year', String(birthYear));

    if (user) {
      await mobileApi.declareAge();
      const updated = { ...user, ageDeclared: true, birthYear };
      setUser(updated);
      await AsyncStorage.setItem('@bottlebazaar_user', JSON.stringify(updated));
    }
  };

  const requestOtp = async (phone: string): Promise<boolean> => {
    await mobileApi.requestOtp(phone);
    return true;
  };

  const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
    if (!/^\d{6}$/.test(otp)) return false;
    const profile = await mobileApi.verifyOtp(phone, otp);
    const loggedUser: MobileUser = {
      id: profile.user.id,
      phoneNumber: profile.user.phone,
      name: profile.user.displayName,
      ageDeclared: profile.user.ageDeclared,
      ageDeclaredDate: profile.user.ageDeclaredAt,
    };
    setUser(loggedUser);
    setIsAgeVerified(profile.user.ageDeclared);
    await AsyncStorage.setItem('@bottlebazaar_user', JSON.stringify(loggedUser));
    if (isAgeVerified && !profile.user.ageDeclared) {
      await mobileApi.declareAge();
      const updated = { ...loggedUser, ageDeclared: true, ageDeclaredDate: new Date().toISOString() };
      setUser(updated);
      await AsyncStorage.setItem('@bottlebazaar_user', JSON.stringify(updated));
      setIsAgeVerified(true);
    }
    return true;
  };

  const logout = async () => {
    await mobileApi.logout();
    setUser(null);
    setIsAgeVerified(false);
    await AsyncStorage.multiRemove(['@bottlebazaar_user', '@bottlebazaar_age_declared', '@bottlebazaar_birth_year']);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAgeVerified,
      confirmAge,
      requestOtp,
      verifyOtp,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
