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
import { isMockOtpEnabled, sendOtp } from '../services/sms';
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

const LoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(8).max(128),
});

const RegisterSchema = z.object({
  fullName: z.string().min(1).max(160),
  email: z.string().email(),
  username: z.string().regex(/^[a-zA-Z0-9._-]{3,80}$/),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  pinCode: z.string().min(1).max(10),
  addressLine1: z.string().min(1).max(300),
  role: z.enum(['customer', 'store_owner']),
});

// Normalize phone (ensure it starts with +91 for Indian numbers)
function normalizePhone(phone: string, countryCode: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('0')) return `${countryCode}${clean.slice(1)}`;
  return `${countryCode}${clean}`;
}

let passwordAuthSchemaReady: Promise<void> | undefined;

function ensurePasswordAuthSchema(): Promise<void> {
  if (!passwordAuthSchemaReady) {
    passwordAuthSchemaReady = (async () => {
      const pool = getPool();
      await pool.query(`
        ALTER TABLE users
          ALTER COLUMN phone DROP NOT NULL;
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS email VARCHAR(200),
          ADD COLUMN IF NOT EXISTS username VARCHAR(80),
          ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(300),
          ADD COLUMN IF NOT EXISTS residence_city VARCHAR(120),
          ADD COLUMN IF NOT EXISTS residence_state VARCHAR(120),
          ADD COLUMN IF NOT EXISTS residence_pin VARCHAR(10);
        CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
          ON users (LOWER(email)) WHERE email IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique
          ON users (LOWER(username)) WHERE username IS NOT NULL;
        CREATE TABLE IF NOT EXISTS password_credentials (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    })().catch((error) => {
      passwordAuthSchemaReady = undefined;
      throw error;
    });
  }
  return passwordAuthSchemaReady;
}

router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensurePasswordAuthSchema();
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid login details', parsed.error.flatten());

    const { identifier, password } = parsed.data;
    const { rows } = await getPool().query(
      `SELECT u.id, u.phone, u.role, u.status, p.password_hash
       FROM users u JOIN password_credentials p ON p.user_id = u.id
       WHERE lower(coalesce(u.email, '')) = lower($1)
          OR lower(coalesce(u.username, '')) = lower($1)
       LIMIT 1`,
      [identifier]
    );
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      throw new UnauthorizedError('Invalid credentials');
    }
    if (rows[0].status !== 'active') {
      throw new AppError(403, 'ACCOUNT_NOT_APPROVED', 'Your account is not approved yet.');
    }

    const sessionId = uuidv4();
    const token = signToken({
      id: rows[0].id,
      phone: rows[0].phone || '',
      role: rows[0].role,
      sessionId,
    });
    await getPool().query(
      `INSERT INTO sessions (id, user_id, token_hash, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, rows[0].id, crypto.createHash('sha256').update(token).digest('hex'),
        req.ip, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );
    res.json({ token, user: { id: rows[0].id, phone: rows[0].phone || '' } });
  } catch (err) {
    next(err);
  }
});

router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensurePasswordAuthSchema();
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid registration details', parsed.error.flatten());
    if (parsed.data.password !== parsed.data.confirmPassword) {
      throw new ValidationError('Passwords do not match');
    }

    const data = parsed.data;
    const pool = getPool();
    const existing = await pool.query(
      `SELECT 1 FROM users
       WHERE lower(email) = lower($1) OR lower(username) = lower($2) LIMIT 1`,
      [data.email, data.username]
    );
    if (existing.rowCount) throw new AppError(409, 'ACCOUNT_EXISTS', 'An account with these credentials already exists.');

    await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users
          (phone, role, status, display_name, email, username, address_line1,
           residence_city, residence_state, residence_pin)
         VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [data.phone ? normalizePhone(data.phone, '+91') : null, data.role, data.fullName,
          data.email, data.username, data.addressLine1, data.city, data.state, data.pinCode]
      );
      await client.query(
        `INSERT INTO password_credentials (user_id, password_hash) VALUES ($1, $2)`,
        [rows[0].id, await bcrypt.hash(data.password, 12)]
      );
    });
    res.status(202).json({ status: 'active', message: 'Registration completed successfully.' });
  } catch (err) {
    next(err);
  }
});


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
    const useMockOtp = isMockOtpEnabled();
    // In development: use fixed OTP 123456 for easy testing
    const otp = useMockOtp ? '123456' : crypto.randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      `INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES ($1, $2, $3)`,
      [phone, codeHash, expiresAt]
    );

    // Send OTP via SMS (real provider in production)
    if (useMockOtp) {
      logger.info({ env: process.env.NODE_ENV }, 'Development OTP enabled: use 123456');
    } else {
      await sendOtp(phone, otp);
    }

    await auditLog({
      action: 'auth.otp_request',
      metadata: { phone: '[REDACTED]' },
      ipAddress: ip,
      requestId: req.headers['x-request-id'] as string,
    });

    // Generic response — do not reveal if account exists
    res.json({
      message: useMockOtp
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
