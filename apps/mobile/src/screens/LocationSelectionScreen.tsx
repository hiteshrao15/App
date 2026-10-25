import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import { copy, Language } from '../i18n';
import { BrandMark, Button } from '../ui';
import { useLocation } from '../context/LocationContext';

export const LocationSelectionScreen = ({ language, onContinue }: { language: Language; onContinue: () => void }) => {
  const t = copy[language];
  const { availableLocations, location, selectLocation } = useLocation();
  const [selected, setSelected] = useState(location.selected ? 'Sohna' : '');
  const [error, setError] = useState('');
  const chooseLocation = async (city: string, state: string, available: boolean) => {
    if (!available) return;
    setSelected(city);
    setError('');
    try {
      await selectLocation(city, state);
    } catch (selectionError) {
      setSelected('');
      setError(selectionError instanceof Error ? selectionError.message : 'This location is not available yet.');
    }
  };

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <BrandMark />
      <View style={styles.hero}>
        <View style={styles.pin}><Text style={styles.pinText}>⌖</Text></View>
        <Text style={styles.kicker}>ONE LOCATION TO START</Text>
        <Text style={styles.title}>We are launching in Sohna</Text>
        <Text style={styles.subtitle}>BottleBazaar is starting with one focused launch location. More cities will be available soon.</Text>
        <View style={styles.locationBadge}><Text style={styles.badgePin}>●</Text><View><Text style={styles.badgeTitle}>Sohna, Gurugram</Text><Text style={styles.badgeSub}>Haryana · 25+ legal age</Text></View></View>
      </View>
      <Text style={styles.sectionTitle}>Available locations</Text>
      <View style={styles.list}>{availableLocations.map((area) => {
        const active = selected === area.city;
        return <TouchableOpacity key={area.city} accessibilityRole="radio" accessibilityState={{ selected: active, disabled: !area.available }} onPress={() => chooseLocation(area.city, area.state, area.available)} style={[styles.area, active && styles.activeArea, !area.available && styles.disabledArea]}>
          <View style={[styles.radio, active && styles.activeRadio]}>{active ? <View style={styles.radioDot} /> : null}</View>
          <View style={styles.locationText}><Text style={[styles.areaText, active && styles.activeAreaText]}>{area.city}, {area.state}</Text><Text style={styles.locationStatus}>{area.available ? 'Launching now' : 'Available soon'}</Text></View>
          {active ? <Text style={styles.check}>✓</Text> : null}
        </TouchableOpacity>;
      })}</View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button label={t.continue} onPress={onContinue} disabled={!selected} />
      <Text style={styles.note}>Sohna currently covers the complete Sohna launch area. No sub-area selection is required.</Text>
    </ScrollView>
  </SafeAreaView>;
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl },
  pin: { width: 72, height: 72, borderRadius: 26, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  pinText: { color: colors.brand, fontSize: 42, fontWeight: '900' },
  kicker: { color: colors.brand, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 30, lineHeight: 35, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  subtitle: { color: colors.inkSoft, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, maxWidth: 340 },
  locationBadge: { marginTop: spacing.xl, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.brand, borderRadius: radius.md, padding: spacing.md },
  badgePin: { color: colors.lime, fontSize: 25 },
  badgeTitle: { color: colors.white, fontSize: 16, fontWeight: '900' },
  badgeSub: { color: '#C4E1CE', fontSize: 12, marginTop: 3 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: spacing.md },
  list: { gap: 9, marginBottom: spacing.lg },
  area: { minHeight: 64, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: 12 },
  activeArea: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  disabledArea: { opacity: 0.55 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  activeRadio: { borderColor: colors.brand },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
  areaText: { color: colors.inkSoft, fontSize: 15, fontWeight: '700', flex: 1 },
  locationText: { flex: 1 },
  locationStatus: { color: colors.muted, fontSize: 12, marginTop: 3 },
  activeAreaText: { color: colors.brandDark, fontWeight: '900' },
  check: { color: colors.brand, fontSize: 20, fontWeight: '900' },
  error: { color: colors.danger, textAlign: 'center', marginBottom: spacing.md },
  note: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: spacing.md },
});
