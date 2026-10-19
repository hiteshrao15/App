// =====================================================
// Authentication Routes — OTP-based phone login
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { getPool, withTransaction } from '../db/pool';
import { getRedis, checkRateLimit } from '../cache/redis';
import { signToken, authenticate } from '../middleware/auth';
import { ValidationError, AppError, UnauthorizedError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { sendOtp } from '../services/sms';
import { auditLog } from '../services/audit';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts. Try again in 15 minutes.', code: 'RATE_LIMIT_EXCEEDED' },
  skipSuccessfulRequests: false,
});

// ── Input schemas ─────────────────────────────────────

const RequestOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  countryCode: z.string().default('+91'),
});

const VerifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
});

// Normalize phone (ensure it starts with +91 for Indian numbers)
function normalizePhone(phone: string, countryCode: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('0')) return `${countryCode}${clean.slice(1)}`;
  return `${countryCode}${clean}`;
}

/**
 * @swagger
 * /api/v1/auth/request-otp:
 *   post:
 *     summary: Request OTP for login/register
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string, example: "+919876543210" }
 *               countryCode: { type: string, example: "+91" }
 */
router.post('/request-otp', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = RequestOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', parsed.error.flatten());
    }

    const phone = normalizePhone(parsed.data.phone, parsed.data.countryCode);
    const ip = req.ip || 'unknown';

    // Redis rate limit: 3 OTPs per phone per 10 minutes
    const phoneLimit = await checkRateLimit(`otp:phone:${phone}`, 600, 3);
    const ipLimit = await checkRateLimit(`otp:ip:${ip}`, 600, 10);

    if (!phoneLimit.allowed || !ipLimit.allowed) {
      logger.warn({ phone: '[REDACTED]', ip }, 'OTP rate limit exceeded');
      throw new AppError(429, 'RATE_LIMIT_EXCEEDED',
        'Too many OTP requests. Please wait before requesting another.');
    }

    // Invalidate any existing unused OTPs for this phone
    const pool = getPool();
    await pool.query(
      `UPDATE otp_codes SET used = true WHERE phone = $1 AND used = false AND expires_at > NOW()`,
      [phone]
    );

    // Generate 6-digit OTP
    const isDev = process.env.NODE_ENV !== 'production';
    // In development: use fixed OTP 123456 for easy testing
    const otp = isDev ? '123456' : crypto.randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      `INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES ($1, $2, $3)`,
      [phone, codeHash, expiresAt]
    );

    // Send OTP via SMS (real provider in production)
    if (!isDev) {
      await sendOtp(phone, otp);
    } else {
      logger.info({ env: 'development' }, 'Development OTP: 123456 (never in production)');
    }

    await auditLog({
      action: 'auth.otp_request',
      metadata: { phone: '[REDACTED]' },
      ipAddress: ip,
      requestId: req.headers['x-request-id'] as string,
    });

    // Generic response — do not reveal if account exists
    res.json({
      message: isDev
        ? 'OTP sent (development mode: use 123456)'
        : 'OTP sent to your phone number',
      expiresIn: 600, // seconds
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and receive JWT
 *     tags: [Auth]
 */
router.post('/verify-otp', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = VerifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', parsed.error.flatten());
    }

    const { otp } = parsed.data;
    const phone = normalizePhone(parsed.data.phone, '+91');
    const ip = req.ip || 'unknown';

    // Rate limit verification attempts
    const verifyLimit = await checkRateLimit(`otp:verify:${phone}`, 600, 10);
    if (!verifyLimit.allowed) {
      throw new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many verification attempts.');
    }

    const pool = getPool();

    // Fetch the most recent unused, unexpired OTP for this phone
    const { rows: otpRows } = await pool.query(
      `SELECT id, code_hash, expires_at, attempt_count
       FROM otp_codes
       WHERE phone = $1 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );

    // Use generic error message to prevent account enumeration
    const genericError = new UnauthorizedError('Invalid or expired OTP');

    if (otpRows.length === 0) throw genericError;

    const otpRecord = otpRows[0];

    // Increment attempt count
    await pool.query(
      `UPDATE otp_codes SET attempt_count = attempt_count + 1 WHERE id = $1`,
      [otpRecord.id]
    );

    if (otpRecord.attempt_count >= 5) {
      await pool.query(`UPDATE otp_codes SET used = true WHERE id = $1`, [otpRecord.id]);
      throw genericError;
    }

    const isValid = await bcrypt.compare(otp, otpRecord.code_hash);
    if (!isValid) throw genericError;

    // Mark OTP as used
    await pool.query(`UPDATE otp_codes SET used = true WHERE id = $1`, [otpRecord.id]);

    // Create or fetch user
    let user = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (phone, country_code)
         VALUES ($1, '+91')
         ON CONFLICT (phone) DO UPDATE SET updated_at = NOW()
         RETURNING id, phone, role, status, display_name, language`,
        [phone]
      );
      return rows[0];
    });

    if (user.status !== 'active') {
      throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended.');
    }

    // Create session
    const sessionId = uuidv4();
    const tokenPayload = {
      id: user.id,
      phone: user.phone,
      role: user.role,
      sessionId,
    };

    const token = signToken(tokenPayload);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      `INSERT INTO sessions (id, user_id, token_hash, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, user.id, tokenHash, ip, sessionExpiry]
    );

    await auditLog({
      action: 'auth.login',
      actorId: user.id,
      actorRole: user.role,
      metadata: { sessionId },
      ipAddress: ip,
      requestId: req.headers['x-request-id'] as string,
    });

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        displayName: user.display_name,
        language: user.language,
      },
      expiresIn: 7 * 24 * 3600,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout and revoke current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    if (!user) throw new UnauthorizedError();

    // Blacklist the session in Redis
    const redis = getRedis();
    await redis.setex(`revoked:session:${user.sessionId}`, 7 * 24 * 3600, '1');

    // Mark session as revoked in DB
    await getPool().query(
      `UPDATE sessions SET revoked = true WHERE id = $1`,
      [user.sessionId]
    );

    await auditLog({
      action: 'auth.logout',
      actorId: user.id,
      actorRole: user.role,
      metadata: { sessionId: user.sessionId },
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'] as string,
    });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
