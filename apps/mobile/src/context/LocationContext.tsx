// =====================================================
// Location & State Excise Regulations Context
// =====================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationState {
  city: string;
  state: string;
  minLegalAge: number;
}

const STATE_AGE_RULES: Record<string, number> = {
  'Maharashtra': 25,
  'Delhi': 25,
  'Karnataka': 21,
  'Goa': 21,
  'Tamil Nadu': 21,
  'Uttar Pradesh': 21,
  'Punjab': 25,
  'Rajasthan': 21,
};

interface LocationContextType {
  location: LocationState;
  setLocation: (city: string, state: string) => Promise<void>;
  availableCities: Array<{ city: string; state: string }>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocationState] = useState<LocationState>({
    city: 'Mumbai',
    state: 'Maharashtra',
    minLegalAge: 25,
  });

  const availableCities = [
    { city: 'Mumbai', state: 'Maharashtra' },
    { city: 'Pune', state: 'Maharashtra' },
    { city: 'Bengaluru', state: 'Karnataka' },
    { city: 'New Delhi', state: 'Delhi' },
    { city: 'Panaji', state: 'Goa' },
    { city: 'Chennai', state: 'Tamil Nadu' },
  ];

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@bottlebazaar_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          setLocationState(parsed);
        }
      } catch (e) {}
    })();
  }, []);

  const setLocation = async (city: string, state: string) => {
    const minLegalAge = STATE_AGE_RULES[state] || 21;
    const newLoc = { city, state, minLegalAge };
    setLocationState(newLoc);
    await AsyncStorage.setItem('@bottlebazaar_location', JSON.stringify(newLoc));
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, availableCities }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};
