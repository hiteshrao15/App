import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<Props> = ({ visible, onClose }) => {
  const { requestOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!visible) return null;

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await requestOtp(phone);
      setStep('OTP');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setError('Enter 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const ok = await verifyOtp(phone, otp);
      if (ok) {
        onClose();
        setStep('PHONE');
      } else {
        setError('Invalid OTP code.');
      }
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Could not verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {step === 'PHONE' ? 'Sign In with Mobile' : 'Verify Mobile OTP'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'PHONE' 
              ? 'Enter your phone number to claim in-store discount coupons and save favorites.'
              : `Enter the 6-digit verification code sent to +91 ${phone}`}
          </Text>

          {step === 'PHONE' ? (
            <View style={{ width: '100%' }}>
              <View style={styles.phoneInputRow}>
                <View style={styles.prefixBox}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.input}
                  keyboardType="phone-pad"
                  placeholder="98200 00000"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Send OTP via SMS</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: '100%' }}>
              <TextInput
                style={[styles.input, styles.otpInput]}
                keyboardType="number-pad"
                placeholder="123456"
                placeholderTextColor={colors.textMuted}
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Verify & Continue</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('PHONE')}>
                <Text style={{ color: colors.accentGold, fontSize: 12, fontWeight: '600' }}>← Change phone number</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    position: 'relative',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  phoneInputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  prefixBox: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.borderSubtle,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  otpInput: {
    borderLeftWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  errorText: {
    color: '#ff8888',
    fontSize: 11,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: colors.accentGold,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 14,
  },
});
