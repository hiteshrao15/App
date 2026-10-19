import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { StatutoryBanner } from '../components/StatutoryBanner';
import { mobileApi, StoreItem } from '../services/api';
import { useLocation } from '../context/LocationContext';

interface Props {
  onSelectStore: (store: StoreItem) => void;
}

export const StoresScreen: React.FC<Props> = ({ onSelectStore }) => {
  const { location } = useLocation();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const list = await mobileApi.getStores();
      setStores(list);
    })();
  }, []);

  const filtered = stores.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Phone Call', `Call store at ${phone}`);
    });
  };

  const handleDirections = (store: StoreItem) => {
    const query = encodeURIComponent(`${store.name}, ${store.address}, ${store.city}`);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  return (
    <View style={styles.screen}>
      <StatutoryBanner compact />

      {/* Header & Search */}
      <View style={styles.searchHeader}>
        <Text style={styles.pageTitle}>Licensed Liquor Retailers</Text>
        <Text style={styles.pageSub}>
          Locate verified shops & government excise license holders in {location.city}
        </Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search by store name, road, or area..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((store) => (
          <View key={store.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeAddress}>📍 {store.address}, {store.city}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>★ {store.rating}</Text>
              </View>
            </View>

            <View style={styles.licenseRow}>
              <Text style={styles.licenseText}>Excise Lic: {store.licenseNumber}</Text>
              <Text style={styles.distanceText}>{store.distanceKm} km away</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => handleCall(store.phone)}>
                <Text style={styles.outlineBtnText}>📞 Call Shop</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.outlineBtn} onPress={() => handleDirections(store)}>
                <Text style={styles.outlineBtnText}>🗺️ Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryBtn} onPress={() => onSelectStore(store)}>
                <Text style={styles.primaryBtnText}>View Deals ({store.dealsCount})</Text>
              </TouchableOpacity>
            </View>
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
  searchHeader: {
    padding: 16,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pageSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 10,
    color: colors.textPrimary,
    fontSize: 13,
  },
  list: {
    padding: 16,
    gap: 14,
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  storeAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  ratingBadge: {
    backgroundColor: 'rgba(212, 163, 89, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  ratingText: {
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  licenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginVertical: 8,
  },
  licenseText: {
    color: colors.textMuted,
    fontSize: 10.5,
    fontFamily: 'monospace',
  },
  distanceText: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  outlineBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  outlineBtnText: {
    color: colors.textPrimary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1.3,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 11.5,
    fontWeight: '800',
  },
});
