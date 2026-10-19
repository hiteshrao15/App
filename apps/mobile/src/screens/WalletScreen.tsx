import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { StatutoryBanner } from '../components/StatutoryBanner';
import { mobileApi, ClaimedVoucher } from '../services/api';

export const WalletScreen: React.FC = () => {
  const [vouchers, setVouchers] = useState<ClaimedVoucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<ClaimedVoucher | null>(null);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    const list = await mobileApi.getClaimedVouchers();
    setVouchers(list);
    if (list.length > 0 && !selectedVoucher) {
      setSelectedVoucher(list[0]);
    }
  };

  return (
    <View style={styles.screen}>
      <StatutoryBanner compact />

      <View style={styles.header}>
        <Text style={styles.title}>🎟️ My Vouchers & Passes</Text>
        <Text style={styles.subtitle}>Present active QR code to the retail counter cashier</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {selectedVoucher ? (
          <View style={styles.activeCard}>
            <View style={styles.activeTop}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{selectedVoucher.discountLabel}</Text>
              </View>
              <Text style={styles.timerText}>⏱️ Active (Valid ~25 mins)</Text>
            </View>

            <Text style={styles.activeTitle}>{selectedVoucher.title}</Text>
            <Text style={styles.activeStore}>🏬 {selectedVoucher.storeName} ({selectedVoucher.storeCity})</Text>

            {/* QR / Token Presentation Area */}
            <View style={styles.qrBox}>
              <View style={styles.qrGrid}>
                {/* Visual QR representation */}
                <Text style={{ fontSize: 72 }}>▦</Text>
              </View>
              <Text style={styles.tokenCode}>{selectedVoucher.tokenCode}</Text>
              <Text style={styles.qrInstructions}>
                Scan QR or dictate code to cashier at checkout
              </Text>
            </View>

            <View style={styles.securityNotice}>
              <Text style={styles.securityText}>
                🔒 Single-use cryptographically signed token. Replay prevention enabled.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🎟️</Text>
            <Text style={styles.emptyTitle}>No Claimed Vouchers</Text>
            <Text style={styles.emptySub}>Browse trending deals and tap "Claim" to generate your in-store discount pass.</Text>
          </View>
        )}

        {/* Voucher List Selector */}
        {vouchers.length > 1 && (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>All Saved Vouchers</Text>
            {vouchers.map((v) => {
              const isSelected = selectedVoucher?.id === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.miniCard, isSelected && styles.activeMiniCard]}
                  onPress={() => setSelectedVoucher(v)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniTitle}>{v.title}</Text>
                    <Text style={styles.miniStore}>{v.storeName}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.miniCode}>{v.tokenCode}</Text>
                    <Text style={styles.miniLabel}>{v.discountLabel}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    padding: 16,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  container: {
    padding: 16,
  },
  activeCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: 20,
    marginBottom: 20,
  },
  activeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: 'rgba(212, 163, 89, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '800',
  },
  timerText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  activeStore: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  qrBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  qrGrid: {
    marginBottom: 6,
  },
  tokenCode: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 4,
    marginBottom: 4,
  },
  qrInstructions: {
    fontSize: 11,
    color: '#444',
    textAlign: 'center',
    fontWeight: '600',
  },
  securityNotice: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  securityText: {
    color: colors.success,
    fontSize: 10,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 30,
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  listSection: {
    gap: 10,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  miniCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  activeMiniCard: {
    borderColor: colors.accentGold,
  },
  miniTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  miniStore: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  miniCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentGold,
  },
  miniLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
