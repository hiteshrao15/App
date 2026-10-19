import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { StatutoryBanner } from '../components/StatutoryBanner';
import { mobileApi, DealItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Props {
  onOpenWallet: () => void;
  onPromptLogin: () => void;
}

export const DealsScreen: React.FC<Props> = ({ onOpenWallet, onPromptLogin }) => {
  const { isAuthenticated } = useAuth();
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  useEffect(() => {
    (async () => {
      const list = await mobileApi.getDeals();
      setDeals(list);
    })();
  }, []);

  const handleClaim = async (deal: DealItem) => {
    if (!isAuthenticated) {
      onPromptLogin();
      return;
    }
    await mobileApi.claimDeal(deal);
    Alert.alert(
      '🎉 Voucher Claimed!',
      `Coupon code for "${deal.title}" is now active in your Wallet! Valid for 30 minutes at checkout.`,
      [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'View in Wallet', onPress: onOpenWallet },
      ]
    );
  };

  const filtered = deals.filter(d => {
    if (selectedFilter === 'ALL') return true;
    return d.category.toUpperCase() === selectedFilter || d.discountType === selectedFilter;
  });

  return (
    <View style={styles.screen}>
      <StatutoryBanner compact />

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'Whiskey', 'Beer', 'Wine', 'Gin', 'PERCENTAGE', 'FLAT', 'BOGO'].map((f) => {
            const isSel = selectedFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, isSel && styles.activeFilterChip]}
                onPress={() => setSelectedFilter(f)}
              >
                <Text style={[styles.filterText, isSel && styles.activeFilterText]}>
                  {f === 'ALL' ? 'All Discounts' : f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((deal) => (
          <View key={deal.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {deal.discountType === 'PERCENTAGE' ? `${deal.discountValue}% OFF` : 
                   deal.discountType === 'FLAT' ? `₹${deal.discountValue} OFF` : 'BUY 2 GET 1'}
                </Text>
              </View>
              <Text style={styles.expiryText}>Expires: {deal.validUntil}</Text>
            </View>

            <Text style={styles.title}>{deal.title}</Text>
            <Text style={styles.desc}>{deal.description}</Text>

            <View style={styles.storeBox}>
              <Text style={styles.storeName}>🏬 {deal.storeName}</Text>
              <Text style={styles.storeDist}>{deal.storeDistanceKm} km • Min Bill: ₹{deal.minSpend}</Text>
            </View>

            <View style={styles.termsBox}>
              <Text style={styles.termsTitle}>Conditions:</Text>
              {deal.terms.map((t, idx) => (
                <Text key={idx} style={styles.termItem}>• {t}</Text>
              ))}
            </View>

            <TouchableOpacity style={styles.claimBtn} onPress={() => handleClaim(deal)}>
              <Text style={styles.claimBtnText}>Claim In-Store Coupon</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  filterBar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: 'rgba(212, 163, 89, 0.2)',
    borderColor: colors.accentGold,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  activeFilterText: {
    color: colors.accentGold,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: 'rgba(212, 163, 89, 0.15)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '800',
  },
  expiryText: {
    color: colors.textMuted,
    fontSize: 10.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  desc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  storeBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  storeName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  storeDist: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  termsBox: {
    marginBottom: 14,
  },
  termsTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 2,
  },
  termItem: {
    fontSize: 10.5,
    color: colors.textMuted,
    lineHeight: 15,
  },
  claimBtn: {
    backgroundColor: colors.accentGold,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
});
