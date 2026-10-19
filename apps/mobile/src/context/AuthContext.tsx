// =====================================================
// Mobile Auth & Age Gate Declaration Context
// =====================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {}
    })();
  }, []);

  const confirmAge = async (birthYear: number) => {
    setIsAgeVerified(true);
    await AsyncStorage.setItem('@bottlebazaar_age_declared', 'true');
    await AsyncStorage.setItem('@bottlebazaar_birth_year', String(birthYear));

    if (user) {
      const updated = { ...user, ageDeclared: true, birthYear };
      setUser(updated);
      await AsyncStorage.setItem('@bottlebazaar_user', JSON.stringify(updated));
    }
  };

  const requestOtp = async (phone: string): Promise<boolean> => {
    // In production, hits POST /api/auth/otp/send
    return true;
  };

  const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
    // Accept valid 6 digit or dev '123456'
    if (otp === '123456' || otp.length === 6) {
      const loggedUser: MobileUser = {
        id: `u-${Date.now()}`,
        phoneNumber: phone.startsWith('+91') ? phone : `+91 ${phone}`,
        name: 'Connoisseur',
        ageDeclared: isAgeVerified,
        ageDeclaredDate: new Date().toISOString(),
      };
      setUser(loggedUser);
      await AsyncStorage.setItem('@bottlebazaar_user', JSON.stringify(loggedUser));
      return true;
    }
    return false;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@bottlebazaar_user');
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
