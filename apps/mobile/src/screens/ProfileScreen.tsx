import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { StatutoryBanner } from '../components/StatutoryBanner';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

interface Props {
  onPromptLogin: () => void;
}

export const ProfileScreen: React.FC<Props> = ({ onPromptLogin }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { location } = useLocation();

  const handleHelpline = () => {
    Linking.openURL('tel:1800110031').catch(() => {
      Alert.alert('Helpline', 'Call National Alcohol Support at 1800-11-0031');
    });
  };

  return (
    <View style={styles.screen}>
      <StatutoryBanner compact />

      <ScrollView contentContainerStyle={styles.container}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 24 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{isAuthenticated ? user?.phoneNumber : 'Guest Patron'}</Text>
            <Text style={styles.userSub}>
              {isAuthenticated ? 'Verified Registered Customer' : 'Browsing guest mode'}
            </Text>
          </View>

          {isAuthenticated ? (
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.loginBtn} onPress={onPromptLogin}>
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Legal Age & Compliance Badge */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⚖️ Legal Compliance Status</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Self-Declared Age:</Text>
            <Text style={styles.valueGold}>Verified ({location.minLegalAge}+ in {location.state})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Excise Jurisdiction:</Text>
            <Text style={styles.value}>{location.state} State Excise</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>FSSAI License:</Text>
            <Text style={styles.value}>10019022009871</Text>
          </View>
        </View>

        {/* Responsible Drinking Section */}
        <View style={styles.helplineCard}>
          <Text style={styles.helplineTitle}>🛡️ Responsible Drinking Initiative</Text>
          <Text style={styles.helplineText}>
            BottleBazaar encourages moderate and legal consumption. Never drink and drive. If you or someone you know seeks counseling, contact the National Alcohol Helpline.
          </Text>
          <TouchableOpacity style={styles.callHelplineBtn} onPress={handleHelpline}>
            <Text style={styles.callHelplineText}>📞 Call 1800-11-0031 (Toll-Free)</Text>
          </TouchableOpacity>
        </View>

        {/* App Info & Links */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About BottleBazaar India</Text>
          <Text style={styles.aboutText}>
            BottleBazaar is India's leading spirits discovery and in-store coupon marketplace. All offers are fulfilled exclusively across the physical billing counter of licensed retail stores. No online sale or delivery is provided.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.versionText}>Version 1.0.0 (Production Release) • Build 2026.10</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loginBtn: {
    backgroundColor: colors.accentGold,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  loginText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  valueGold: {
    fontSize: 12,
    color: colors.accentGold,
    fontWeight: '700',
  },
  helplineCard: {
    backgroundColor: 'rgba(212, 163, 89, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: 16,
  },
  helplineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentGold,
    marginBottom: 6,
  },
  helplineText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  callHelplineBtn: {
    backgroundColor: 'rgba(212, 163, 89, 0.2)',
    borderWidth: 1,
    borderColor: colors.accentGold,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  callHelplineText: {
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '800',
  },
  aboutText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 12,
  },
  versionText: {
    fontSize: 10.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
