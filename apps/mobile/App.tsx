import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { colors } from './src/theme/colors';
import { copy, Language, loadLanguage } from './src/i18n';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { AuthFlowScreen } from './src/screens/AuthFlowScreen';
import { AccountScreenNew, DiscoverScreenNew, FavoritesScreenNew, HomeScreenNew, OffersScreenNew } from './src/screens/NewCustomerScreens';
import { DealItem, StoreItem } from './src/services/api';
import { StoreDetailModal } from './src/screens/StoreDetailModal';
import { WalletScreen } from './src/screens/WalletScreen';
import { LocationSelectionScreen } from './src/screens/LocationSelectionScreen';
import { useLocation } from './src/context/LocationContext';

type Entry = 'welcome' | 'login' | 'signup';
type Tab = 'home' | 'discover' | 'offers' | 'favorites' | 'account' | 'wallet';

const MainApp = () => {
  const auth = useAuth();
  const locationContext = useLocation();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [tab, setTab] = useState<Tab>('home');
  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { (async () => { const [seen, lang] = await Promise.all([AsyncStorage.getItem('@bottlebazaar_welcome_seen'), loadLanguage()]); setLanguage(lang); setEntry(seen === 'true' ? null : 'welcome'); setReady(true); })(); }, []);
  const chooseLanguage = async () => { const next = language === 'en' ? 'hi' : 'en'; setLanguage(next); await AsyncStorage.setItem('@bottlebazaar_language', next); };
  const begin = (next: Entry) => { setEntry(next); AsyncStorage.setItem('@bottlebazaar_welcome_seen', 'true'); };
  const completeAuth = async () => { await auth.confirmAge(new Date().getFullYear() - 25); setEntry(null); setTab('home'); };
  if (!ready) return <View style={styles.loading}><Text style={styles.loadingMark}>B</Text></View>;
  if (!auth.isAuthenticated && entry === 'welcome') return <WelcomeScreen language={language} onLogin={() => begin('login')} onSignup={() => begin('signup')} onLanguage={chooseLanguage} />;
  if (!auth.isAuthenticated && (entry === 'login' || entry === 'signup')) return <AuthFlowScreen mode={entry} language={language} requestOtp={auth.requestOtp} verifyOtp={auth.verifyOtp} updateProfile={auth.updateProfile} onComplete={completeAuth} onBack={() => setEntry('welcome')} />;
  if (!auth.isAuthenticated) return <WelcomeScreen language={language} onLogin={() => begin('login')} onSignup={() => begin('signup')} onLanguage={chooseLanguage} />;
  if (!locationContext.isLocationSelected) return <LocationSelectionScreen language={language} onContinue={() => setTab('home')} />;
  const navigate = (next: string) => setTab(next as Tab);
  return <SafeAreaView style={styles.safe}><StatusBar barStyle="dark-content" backgroundColor={colors.paper} /><View style={styles.content}>
    {tab === 'home' && <HomeScreenNew language={language} onTab={navigate} onSelectDeal={setSelectedDeal} onSelectStore={setSelectedStore} />}
    {tab === 'discover' && <DiscoverScreenNew language={language} onSelectStore={setSelectedStore} />}
    {tab === 'offers' && <OffersScreenNew language={language} onSelectDeal={setSelectedDeal} />}
    {tab === 'favorites' && <FavoritesScreenNew language={language} />}
    {tab === 'account' && <AccountScreenNew language={language} onLanguage={chooseLanguage} onLogout={auth.logout} />}
    {tab === 'wallet' && <WalletScreen />}
  </View><View style={styles.nav}>{([['home', '⌂', copy[language].home], ['discover', '⌕', copy[language].discover], ['offers', '✦', copy[language].offers], ['favorites', '♡', copy[language].favorites], ['account', '○', copy[language].account]] as const).map(([id, icon, label]) => <TouchableOpacity key={id} accessibilityRole="button" accessibilityLabel={label} onPress={() => setTab(id)} style={styles.navItem}><Text style={[styles.navIcon, tab === id && styles.activeText]}>{icon}</Text><Text style={[styles.navLabel, tab === id && styles.activeText]}>{label}</Text></TouchableOpacity>)}</View>
    <StoreDetailModal store={selectedStore} onClose={() => setSelectedStore(null)} onSelectDeal={(deal) => { setSelectedStore(null); setSelectedDeal(deal); setTab('offers'); }} />
  </SafeAreaView>;
};

export default function App() { return <AuthProvider><LocationProvider><MainApp /></LocationProvider></AuthProvider>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.paper }, content: { flex: 1 }, loading: { flex: 1, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }, loadingMark: { color: colors.lime, fontSize: 100, fontWeight: '900' }, nav: { height: 74, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', paddingBottom: 8 }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }, navIcon: { color: colors.muted, fontSize: 24, lineHeight: 25 }, navLabel: { color: colors.muted, fontSize: 10, fontWeight: '800' }, activeText: { color: colors.brand } });
