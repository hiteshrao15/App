import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  compact?: boolean;
}

export const StatutoryBanner: React.FC<Props> = ({ compact = false }) => {
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <Text style={styles.text}>
        ⚠️ STATUTORY WARNING: ALCOHOL CONSUMPTION IS INJURIOUS TO HEALTH. BE SAFE — DON'T DRINK AND DRIVE.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(230, 145, 56, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 145, 56, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  compactContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  text: {
    color: colors.accentAmber,
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
