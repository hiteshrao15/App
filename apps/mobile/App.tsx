import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { colors } from './src/theme/colors';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { AgeGateModal } from './src/components/AgeGateModal';
import { LoginModal } from './src/screens/LoginModal';
import { StoreDetailModal } from './src/screens/StoreDetailModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { StoresScreen } from './src/screens/StoresScreen';
import { DealsScreen } from './src/screens/DealsScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { StoreItem, DealItem } from './src/services/api';

type Tab = 'home' | 'stores' | 'deals' | 'wallet' | 'profile';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'home', label: 'Discover', icon: '🍾' },
    { id: 'stores', label: 'Stores', icon: '🏬' },
    { id: 'deals', label: 'Deals', icon: '🏷️' },
    { id: 'wallet', label: 'Wallet', icon: '🎟️' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Screen View */}
      <View style={styles.container}>
        {activeTab === 'home' && (
          <HomeScreen
            onSelectDeal={(deal) => setActiveTab('deals')}
            onSelectStore={(store) => setSelectedStore(store)}
            onOpenWallet={() => setActiveTab('wallet')}
            onPromptLogin={() => setIsLoginOpen(true)}
          />
        )}
        {activeTab === 'stores' && (
          <StoresScreen
            onSelectStore={(store) => setSelectedStore(store)}
          />
        )}
        {activeTab === 'deals' && (
          <DealsScreen
            onOpenWallet={() => setActiveTab('wallet')}
            onPromptLogin={() => setIsLoginOpen(true)}
          />
        )}
        {activeTab === 'wallet' && <WalletScreen />}
        {activeTab === 'profile' && (
          <ProfileScreen onPromptLogin={() => setIsLoginOpen(true)} />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legal Drinking Age Gate Modal */}
      <AgeGateModal />

      {/* In-App Authentication Modal */}
      <LoginModal visible={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Store Detail Popup Modal */}
      <StoreDetailModal
        store={selectedStore}
        onClose={() => setSelectedStore(null)}
        onSelectDeal={(d) => {
          setSelectedStore(null);
          setActiveTab('deals');
        }}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <MainApp />
      </LocationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingVertical: 8,
    paddingBottom: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeTabButton: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeTabLabel: {
    color: colors.accentGold,
    fontWeight: '800',
  },
});
