// =====================================================
// Location & State Excise Regulations Context
// =====================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationState {
  city: string;
  state: string;
  minLegalAge: number;
  selected: boolean;
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
  selectLocation: (city: string, state: string) => Promise<void>;
  availableLocations: Array<{ city: string; state: string; available: boolean }>;
  isLocationSelected: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocationState] = useState<LocationState>({
    city: 'Sohna',
    state: 'Haryana',
    minLegalAge: 25,
    selected: false,
  });

  const availableLocations = [
    { city: 'Sohna', state: 'Haryana', available: true },
    { city: 'Gurugram', state: 'Haryana', available: false },
    { city: 'Manesar', state: 'Haryana', available: false },
    { city: 'Faridabad', state: 'Haryana', available: false },
  ];

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@bottlebazaar_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.city === 'Sohna' && parsed.state === 'Haryana') {
            setLocationState({ city: 'Sohna', state: 'Haryana', minLegalAge: 25, selected: Boolean(parsed.selected || parsed.area) });
          }
        }
      } catch {
        // A missing or invalid saved location should keep the selection gate visible.
      }
    })();
  }, []);

  const selectLocation = async (city: string, state: string) => {
    if (city !== 'Sohna' || state !== 'Haryana') {
      throw new Error('This location is coming soon.');
    }
    const newLoc = { city: 'Sohna', state: 'Haryana', minLegalAge: 25, selected: true };
    setLocationState(newLoc);
    await AsyncStorage.setItem('@bottlebazaar_location', JSON.stringify(newLoc));
  };

  return (
    <LocationContext.Provider value={{ location, selectLocation, availableLocations, isLocationSelected: location.selected }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};
