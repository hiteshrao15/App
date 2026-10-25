import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { BrandMark, Button } from '../ui';
import { copy, Language } from '../i18n';

export const WelcomeScreen = ({ language, onLogin, onSignup, onLanguage }: { language: Language; onLogin: () => void; onSignup: () => void; onLanguage: () => void }) => {
  const t = copy[language];
  return <SafeAreaView style={styles.safe}>
    <View style={styles.top}><BrandMark /><Text accessibilityRole="button" onPress={onLanguage} style={styles.language}>{language === 'en' ? 'हिंदी' : 'English'}</Text></View>
    <View style={styles.hero}>
      <View style={styles.illustration}><Text style={styles.emoji}>✦</Text><Text style={styles.bottle}>B</Text><View style={styles.orbit} /></View>
      <Text style={styles.kicker}>DISCOVER • SAVE • REDEEM IN-STORE</Text>
      <Text style={styles.title}>{t.welcome}</Text>
      <Text style={styles.sub}>{t.welcomeSub}</Text>
    </View>
    <View style={styles.actions}><Button label={t.signup} onPress={onSignup} /><Button label={t.login} onPress={onLogin} secondary /><Text style={styles.terms}>{t.terms}</Text></View>
  </SafeAreaView>;
};
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper, padding: spacing.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  language: { color: colors.brand, fontWeight: '800', padding: 10 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  illustration: { width: 190, height: 190, borderRadius: 70, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 36, transform: [{ rotate: '-5deg' }] },
  bottle: { color: colors.lime, fontSize: 118, fontWeight: '900', lineHeight: 135 },
  emoji: { position: 'absolute', color: colors.white, fontSize: 38, top: 22, right: 28 },
  orbit: { position: 'absolute', width: 214, height: 214, borderWidth: 1, borderColor: colors.borderAccent, borderRadius: 80, transform: [{ rotate: '18deg' }] },
  kicker: { color: colors.brand, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textAlign: 'center', marginBottom: 12 },
  title: { color: colors.ink, fontSize: 39, lineHeight: 43, fontWeight: '900', textAlign: 'center', letterSpacing: -1.5 },
  sub: { color: colors.inkSoft, textAlign: 'center', fontSize: 16, lineHeight: 23, marginTop: 16, maxWidth: 330 },
  actions: { gap: 10 },
  terms: { textAlign: 'center', color: colors.muted, fontSize: 11, lineHeight: 16, marginHorizontal: spacing.lg, marginTop: 6 },
});
