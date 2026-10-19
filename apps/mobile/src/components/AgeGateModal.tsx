import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

export const AgeGateModal: React.FC = () => {
  const { isAgeVerified, confirmAge } = useAuth();
  const { location, setLocation, availableCities } = useLocation();

  const currentYear = 2026;
  const [selectedYear, setSelectedYear] = useState<number>(2000);
  const [underageError, setUnderageError] = useState(false);

  if (isAgeVerified) return null;

  const userAge = currentYear - selectedYear;
  const isEligible = userAge >= location.minLegalAge;

  const handleConfirm = async () => {
    if (!isEligible) {
      setUnderageError(true);
      return;
    }
    await confirmAge(selectedYear);
  };

  return (
    <Modal visible={!isAgeVerified} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Text style={{ fontSize: 32 }}>🍾</Text>
          </View>

          <Text style={styles.title}>Legal Drinking Age Gate</Text>
          <Text style={styles.subtitle}>
            In accordance with Indian State Excise Laws, you must meet the statutory minimum drinking age to view liquor discounts.
          </Text>

          {/* Location Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Select Your Current State & City:</Text>
            <View style={styles.chipsRow}>
              {availableCities.map((c) => {
                const isSelected = location.city === c.city;
                return (
                  <TouchableOpacity
                    key={c.city}
                    style={[styles.chip, isSelected && styles.activeChip]}
                    onPress={() => {
                      setLocation(c.city, c.state);
                      setUnderageError(false);
                    }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                      {c.city} ({c.state})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Legal Age Alert */}
          <View style={styles.ruleBadge}>
            <Text style={styles.ruleText}>
              Legal Age in {location.state}: <Text style={{ fontWeight: '800', color: colors.accentGold }}>{location.minLegalAge} Years</Text>
            </Text>
          </View>

          {/* Birth Year Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Select Your Birth Year: (You are ~{userAge} years old)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearsScroll}>
              {[1980, 1985, 1990, 1995, 1998, 2000, 2001, 2002, 2003, 2004, 2005, 2006].map((yr) => {
                const isYrSelected = selectedYear === yr;
                return (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.yearChip, isYrSelected && styles.activeYearChip]}
                    onPress={() => {
                      setSelectedYear(yr);
                      setUnderageError(false);
                    }}
                  >
                    <Text style={[styles.yearText, isYrSelected && styles.activeYearText]}>{yr}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {underageError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                Access Denied: You must be at least {location.minLegalAge} years old in {location.state} to access BottleBazaar.
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm}>
            <Text style={styles.buttonText}>I Confirm & Declare Legal Age</Text>
          </TouchableOpacity>

          <Text style={styles.legalDisclaimer}>
            By entering, you certify that all information submitted is true and you will abide by local excise regulations. In-store retailers will verify physical government photo ID before handing over products.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 163, 89, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  section: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  activeChip: {
    borderColor: colors.accentGold,
    backgroundColor: 'rgba(212, 163, 89, 0.2)',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  activeChipText: {
    color: colors.accentGold,
  },
  ruleBadge: {
    width: '100%',
    backgroundColor: 'rgba(212, 163, 89, 0.08)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  ruleText: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  yearsScroll: {
    flexDirection: 'row',
  },
  yearChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: 8,
  },
  activeYearChip: {
    borderColor: colors.accentGold,
    backgroundColor: colors.accentGold,
  },
  yearText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  activeYearText: {
    color: '#000',
  },
  errorBox: {
    width: '100%',
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#ff8888',
    fontSize: 11.5,
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.accentGold,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  legalDisclaimer: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
});
