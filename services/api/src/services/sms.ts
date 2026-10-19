// =====================================================
// SMS Service — Real Twilio integration with dev mode
// =====================================================
import { logger } from '../utils/logger';

export async function sendOtp(phone: string, otp: string): Promise<void> {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Development: log only, never send real SMS
    logger.info({ env: 'development' }, `[DEV] OTP for [REDACTED]: [REDACTED]`);
    return;
  }

  // Production: use Twilio
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    logger.error('Twilio credentials not configured — OTP not sent');
    throw new Error('SMS provider not configured. Contact support.');
  }

  try {
    // Dynamic import to avoid loading Twilio in development
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);

    await client.messages.create({
      body: `Your BottleBazaar verification code is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`,
      from: fromNumber,
      to: phone,
    });

    logger.info('OTP SMS sent successfully');
  } catch (err) {
    logger.error({ err }, 'Failed to send OTP via Twilio');
    throw new Error('Failed to send OTP. Please try again.');
  }
}
