// SMS Service — MSG91 integration with an explicit development bypass
import { logger } from '../utils/logger';

export function isMockOtpEnabled(): boolean {
  return process.env.DEV_MOCK_OTP === 'true';
}

export async function sendOtp(phone: string, otp: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    logger.error('MSG91 credentials not configured — OTP not sent');
    throw new Error('SMS provider not configured. Contact support.');
  }

  try {
    const response = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authkey: authKey,
        template_id: templateId,
        mobile: phone.replace(/^\+/, ''),
        otp,
      }),
    });
    const result = await response.json().catch(() => ({})) as { type?: string; message?: string };
    if (!response.ok || (result.type && result.type.toLowerCase() !== 'success')) {
      logger.error({ status: response.status, providerMessage: result.message }, 'MSG91 rejected OTP request');
      throw new Error('MSG91 rejected OTP request');
    }
    logger.info('OTP SMS sent successfully via MSG91');
  } catch (err) {
    logger.error({ err }, 'Failed to send OTP via MSG91');
    throw new Error('Failed to send OTP. Please try again.');
  }
}
