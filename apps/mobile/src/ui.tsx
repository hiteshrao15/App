import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from './theme/colors';

export const BrandMark = ({ inverse = false }: { inverse?: boolean }) => (
  <View style={styles.brandRow}>
    <View style={[styles.mark, inverse && styles.markInverse]}><Text style={styles.markText}>B</Text></View>
    <Text style={[styles.brand, inverse && styles.inverseText]}>BottleBazaar</Text>
  </View>
);

export const Button = ({ label, onPress, secondary = false, disabled = false, loading = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean; loading?: boolean }) => (
  <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled || loading} style={[styles.button, secondary && styles.secondaryButton, (disabled || loading) && styles.disabled]}>
    {loading ? <ActivityIndicator color={secondary ? colors.brand : colors.white} /> : <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>}
  </TouchableOpacity>
);

export const Field = ({ label, error, ...props }: TextInputProps & { label: string; error?: string }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style, error && styles.inputError]} />
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>
);

export const SearchBar = ({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) => (
  <View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.searchInput} returnKeyType="search" /></View>
);

export const SectionTitle = ({ title, action }: { title: string; action?: string }) => <View style={styles.sectionRow}><Text style={styles.sectionTitle}>{title}</Text>{action ? <Text style={styles.sectionAction}>{action}</Text> : null}</View>;

export const Pill = ({ children, tone = 'brand' }: { children: string | number; tone?: 'brand' | 'amber' | 'muted' }) => <View style={[styles.pill, tone === 'amber' && styles.amberPill, tone === 'muted' && styles.mutedPill]}><Text style={[styles.pillText, tone === 'amber' && styles.amberText, tone === 'muted' && styles.mutedText]}>{String(children)}</Text></View>;

export const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  markInverse: { backgroundColor: colors.lime },
  markText: { color: colors.white, fontSize: 21, fontWeight: '900' },
  brand: { color: colors.ink, fontSize: 20, fontWeight: '900', letterSpacing: -0.6 },
  inverseText: { color: colors.white },
  button: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  secondaryButton: { backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderAccent },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  secondaryText: { color: colors.brandDark },
  disabled: { opacity: 0.5 },
  fieldWrap: { marginBottom: spacing.md },
  label: { color: colors.inkSoft, fontWeight: '700', fontSize: 13, marginBottom: 7 },
  input: { minHeight: 52, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: spacing.md, fontSize: 16 },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 12, marginTop: 5 },
  search: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  searchIcon: { color: colors.brand, fontSize: 25, marginRight: 8 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 15 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  sectionAction: { color: colors.brand, fontSize: 13, fontWeight: '800' },
  pill: { backgroundColor: colors.brandSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  amberPill: { backgroundColor: colors.accentLight },
  mutedPill: { backgroundColor: colors.bgSecondary },
  pillText: { color: colors.brandDark, fontWeight: '800', fontSize: 11 },
  amberText: { color: colors.accentBrass },
  mutedText: { color: colors.inkSoft },
});
