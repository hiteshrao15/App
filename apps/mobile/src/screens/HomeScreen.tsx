import React, { useEffect, useState } from 'react';
import { View as RNView, Text as RNText, StyleSheet as RNStyleSheet, ScrollView as RNScrollView, TouchableOpacity as RNTouchableOpacity, RefreshControl as RNRefreshControl, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { StatutoryBanner } from '../components/StatutoryBanner';
import { mobileApi, StoreItem, DealItem } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: '1', name: 'Whiskey', icon: '🥃' },
  { id: '2', name: 'Beer', icon: '🍺' },
  { id: '3', name: 'Wine', icon: '🍷' },
  { id: '4', name: 'Gin', icon: '🍸' },
  { id: '5', name: 'Vodka', icon: '🧊' },
  { id: '6', name: 'Rum', icon: '🥥' },
  { id: '7', name: 'Mixers', icon: '🥤' },
];

interface Props {
  onSelectDeal: (deal: DealItem) => void;
  onSelectStore: (store: StoreItem) => void;
  onOpenWallet: () => void;
  onPromptLogin: () => void;
}

export const HomeScreen: React.FC<Props> = ({ onSelectDeal, onSelectStore, onOpenWallet, onPromptLogin }) => {
  const { location } = useLocation();
  const { isAuthenticated } = useAuth();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Whiskey');

  useEffect(() => {
    loadData();
  }, [location.city]);

  const loadData = async () => {
    setError('');
    try {
      const [s, d] = await Promise.all([
        mobileApi.getStores(location.city),
        mobileApi.getDeals(location.city),
      ]);
      setStores(s);
      setDeals(d);
    } catch {
      setError('We could not load live stores and offers. Check your connection and try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleClaim = async (deal: DealItem) => {
    if (!isAuthenticated) {
      onPromptLogin();
      return;
    }
    await mobileApi.claimDeal(deal);
    Alert.alert(
      '🎉 Voucher Claimed!',
      `Your discount coupon for "${deal.title}" has been saved to your Wallet. Present the QR code at the billing counter within 30 minutes.`,
      [
        { text: 'Later', style: 'cancel' },
        { text: 'View in Wallet', onPress: onOpenWallet },
      ]
    );
  };

  return (
    <RNView style={styles.screen}>
      <StatutoryBanner />

      {/* Header bar */}
      <RNView style={styles.header}>
        <RNView>
          <RNText style={styles.appTitle}>🍾 BottleBazaar</RNText>
          <RNText style={styles.locationSubtitle}>
            📍 {location.city}, {location.state} • Legal Age: {location.minLegalAge}+
          </RNText>
        </RNView>

        <RNTouchableOpacity style={styles.walletBtn} onPress={onOpenWallet}>
          <RNText style={styles.walletBtnText}>🎟️ My Vouchers</RNText>
        </RNTouchableOpacity>
      </RNView>

      <RNScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RNRefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentGold} />}
      >
        {error ? (
          <RNView style={styles.errorCard}>
            <RNText style={styles.errorText}>{error}</RNText>
            <RNTouchableOpacity onPress={loadData} style={styles.retryButton}>
              <RNText style={styles.retryText}>Retry</RNText>
            </RNTouchableOpacity>
          </RNView>
        ) : null}
        {/* Compliance Notice Badge */}
        <RNView style={styles.complianceBadge}>
          <RNText style={styles.complianceText}>
            🔒 100% In-Store Redemption at Licensed Retail Outlets • No Delivery
          </RNText>
        </RNView>

        {/* Hero Banner */}
        <RNView style={styles.heroBanner}>
          <RNText style={styles.heroTag}>EXCLUSIVE FESTIVE DISCOUNTS</RNText>
          <RNText style={styles.heroTitle}>Unlock Up to 20% Off at Top Spirits Boutiques</RNText>
          <RNText style={styles.heroSubtitle}>Claim secure mobile vouchers & redeem in-person at checkout</RNText>
        </RNView>

        {/* Category Pills */}
        <RNView style={styles.sectionHeader}>
          <RNText style={styles.sectionTitle}>Browse by Category</RNText>
        </RNView>
        <RNScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map((cat) => {
            const isSel = selectedCategory === cat.name;
            return (
              <RNTouchableOpacity
                key={cat.id}
                style={[styles.catPill, isSel && styles.activeCatPill]}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <RNText style={{ fontSize: 18 }}>{cat.icon}</RNText>
                <RNText style={[styles.catName, isSel && styles.activeCatName]}>{cat.name}</RNText>
              </RNTouchableOpacity>
            );
          })}
        </RNScrollView>

        {/* Trending Deals */}
        <RNView style={styles.sectionHeader}>
          <RNText style={styles.sectionTitle}>🔥 Trending In-Store Deals</RNText>
          <RNText style={styles.sectionAction}>Swipe for more</RNText>
        </RNView>

        <RNScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dealsScroll}>
          {deals.map((deal) => (
            <RNView key={deal.id} style={styles.dealCard}>
              <RNView style={styles.dealBadge}>
                <RNText style={styles.dealBadgeText}>
                  {deal.discountType === 'PERCENTAGE' ? `${deal.discountValue}% OFF` : 
                   deal.discountType === 'FLAT' ? `₹${deal.discountValue} OFF` : 'BUY 2 GET 1'}
                </RNText>
              </RNView>

              <RNText style={styles.dealTitle} numberOfLines={2}>{deal.title}</RNText>
              <RNText style={styles.dealStore} numberOfLines={1}>🏬 {deal.storeName}</RNText>
              <RNText style={styles.dealMeta}>
                Min Bill: ₹{deal.minSpend} • {deal.storeDistanceKm} km away
              </RNText>

              <RNTouchableOpacity style={styles.claimButton} onPress={() => handleClaim(deal)}>
                <RNText style={styles.claimButtonText}>Claim In-Store Coupon</RNText>
              </RNTouchableOpacity>
            </RNView>
          ))}
        </RNScrollView>

        {/* Featured Retailers */}
        <RNView style={styles.sectionHeader}>
          <RNText style={styles.sectionTitle}>🏬 Verified Retailers Nearby</RNText>
        </RNView>

        <RNView style={styles.storesList}>
          {stores.map((store) => (
            <RNTouchableOpacity 
              key={store.id} 
              style={styles.storeCard}
              onPress={() => onSelectStore(store)}
            >
              <RNView style={{ flex: 1 }}>
                <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <RNText style={styles.storeName}>{store.name}</RNText>
                  <RNText style={styles.verifiedTag}>✓ Verified</RNText>
                </RNView>
                <RNText style={styles.storeAddress}>{store.address}</RNText>
                <RNView style={styles.storeFooter}>
                  <RNText style={styles.storeRating}>★ {store.rating} ({store.reviewCount})</RNText>
                  <RNText style={styles.storeDist}>• {store.distanceKm} km</RNText>
                  <RNText style={styles.storeDeals}>• {store.dealsCount} Live Deals</RNText>
                </RNView>
              </RNView>
              <RNText style={{ fontSize: 18, color: colors.accentGold }}>›</RNText>
            </RNTouchableOpacity>
          ))}
        </RNView>

        <RNView style={{ height: 40 }} />
      </RNScrollView>
    </RNView>
  );
};

const styles = RNStyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.bgSecondary,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  locationSubtitle: {
    fontSize: 11,
    color: colors.accentGold,
    marginTop: 2,
    fontWeight: '600',
  },
  walletBtn: {
    backgroundColor: 'rgba(212, 163, 89, 0.15)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  walletBtnText: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '700',
  },
  complianceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
  },
  complianceText: {
    color: colors.success,
    fontSize: 10.5,
    textAlign: 'center',
    fontWeight: '600',
  },
  heroBanner: {
    margin: 16,
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  errorCard: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(192, 89, 89, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(192, 89, 89, 0.4)',
  },
  errorText: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.accentGold,
  },
  retryText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  heroTag: {
    color: colors.accentGold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 22,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionAction: {
    fontSize: 11,
    color: colors.textMuted,
  },
  catScroll: {
    paddingLeft: 16,
    marginBottom: 12,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  activeCatPill: {
    borderColor: colors.accentGold,
    backgroundColor: 'rgba(212, 163, 89, 0.2)',
  },
  catName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeCatName: {
    color: colors.accentGold,
  },
  dealsScroll: {
    paddingLeft: 16,
    marginBottom: 14,
  },
  dealCard: {
    width: 240,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  dealBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 163, 89, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  dealBadgeText: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '800',
  },
  dealTitle: {
    color: colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 6,
    minHeight: 36,
  },
  dealStore: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  dealMeta: {
    color: colors.textMuted,
    fontSize: 10.5,
    marginBottom: 12,
  },
  claimButton: {
    backgroundColor: colors.accentGold,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  storesList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
  },
  storeName: {
    color: colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  verifiedTag: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  storeAddress: {
    color: colors.textSecondary,
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 6,
  },
  storeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeRating: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '700',
  },
  storeDist: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  storeDeals: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
});
