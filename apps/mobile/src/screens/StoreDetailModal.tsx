import React from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { StoreItem, DealItem } from '../services/api';

interface Props {
  store: StoreItem | null;
  onClose: () => void;
  onSelectDeal: (deal: DealItem) => void;
}

export const StoreDetailModal: React.FC<Props> = ({ store, onClose, onSelectDeal }) => {
  if (!store) return null;

  const handleCall = () => {
    Linking.openURL(`tel:${store.phone}`).catch(() => {
      Alert.alert('Phone Call', `Call store at ${store.phone}`);
    });
  };

  const handleDirections = () => {
    const query = encodeURIComponent(`${store.name}, ${store.address}, ${store.city}`);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  return (
    <Modal visible={!!store} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{store.name}</Text>
              <Text style={styles.address}>📍 {store.address}, {store.city}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* License & Hours */}
            <View style={styles.metaBox}>
              <View style={styles.row}>
                <Text style={styles.label}>Excise License:</Text>
                <Text style={styles.monoValue}>{store.licenseNumber}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Trading Hours:</Text>
                <Text style={styles.value}>10:00 AM – 10:30 PM (Daily)</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Rating & Reputation:</Text>
                <Text style={styles.valueGold}>★ {store.rating} ({store.reviewCount} verified patrons)</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                <Text style={styles.actionBtnText}>📞 Call Outlet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleDirections}>
                <Text style={styles.actionBtnText}>🗺️ Open Maps</Text>
              </TouchableOpacity>
            </View>

            {/* In-Store Deals available */}
            <Text style={styles.dealsHeader}>Current In-Store Offers ({store.dealsCount})</Text>
            <View style={styles.dealsList}>
              <View style={styles.dealItem}>
                <View style={styles.dealBadge}>
                  <Text style={styles.dealBadgeText}>15% OFF</Text>
                </View>
                <Text style={styles.dealTitle}>15% Off Single Malt Whiskies</Text>
                <Text style={styles.dealSub}>Min Spend ₹4,000 • In-store counter discount</Text>
              </View>

              <View style={styles.dealItem}>
                <View style={styles.dealBadge}>
                  <Text style={styles.dealBadgeText}>FLAT ₹300 OFF</Text>
                </View>
                <Text style={styles.dealTitle}>Flat ₹300 Off Craft Gin Selection</Text>
                <Text style={styles.dealSub}>Min Spend ₹2,500 • Valid on 750ml bottles</Text>
              </View>
            </View>

            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                ⚠️ Please note: Alcohol is strictly sold in-person at this retail premise. Customers must produce government age ID upon demand by cashier.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  address: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  closeBtn: {
    padding: 6,
  },
  metaBox: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 11.5,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  valueGold: {
    fontSize: 11.5,
    color: colors.accentGold,
    fontWeight: '700',
  },
  monoValue: {
    fontSize: 11.5,
    color: colors.accentGold,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: 'rgba(212, 163, 89, 0.15)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  dealsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  dealsList: {
    gap: 10,
    marginBottom: 16,
  },
  dealItem: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 12,
  },
  dealBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 163, 89, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  dealBadgeText: {
    color: colors.accentGold,
    fontSize: 10,
    fontWeight: '800',
  },
  dealTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dealSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  noticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  noticeText: {
    color: colors.warning,
    fontSize: 10.5,
    lineHeight: 15,
  },
});
