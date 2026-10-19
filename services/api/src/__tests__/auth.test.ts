// =====================================================
// Auth Route Tests — OTP flow, rate limiting, sessions
// =====================================================
import request from 'supertest';
import { createApp } from '../app';
import { getPool } from '../db/pool';
import { getRedis } from '../cache/redis';

const app = createApp();

describe('Auth Routes', () => {
  const testPhone = '+919800000001';

  beforeEach(async () => {
    // Clean test data
    const pool = getPool();
    await pool.query(`DELETE FROM otp_codes WHERE phone = $1`, [testPhone]);
    await pool.query(`DELETE FROM audit_logs WHERE actor_id IN (SELECT id FROM users WHERE phone = $1)`, [testPhone]);
    await pool.query(`DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE phone = $1)`, [testPhone]);
    await pool.query(`DELETE FROM users WHERE phone = $1`, [testPhone]);

    // Redis counters outlive database rows, so reset only the test phone's
    // authentication counters to keep cases independent.
    const redis = getRedis();
    const rateLimitKeys = await redis.keys(`rl:otp:*${testPhone}*`);
    rateLimitKeys.push(...await redis.keys('rl:otp:ip:*'));
    if (rateLimitKeys.length > 0) {
      await redis.del(...rateLimitKeys);
    }
  });

  describe('POST /api/v1/auth/request-otp', () => {
    it('should accept a valid phone number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ phone: testPhone })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('expiresIn', 600);
    });

    it('should reject invalid phone numbers', async () => {
      await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ phone: 'notaphone' })
        .expect(400);
    });

    it('should reject empty phone', async () => {
      await request(app)
        .post('/api/v1/auth/request-otp')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    beforeEach(async () => {
      // Request OTP first (in dev mode, it's 123456)
      await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ phone: testPhone });
    });

    it('should verify valid OTP and return JWT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: testPhone, otp: '123456' }) // dev OTP
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.token).toMatch(/^eyJ/); // JWT format
      expect(res.body.user).toHaveProperty('phone', testPhone);
      expect(res.body.user).toHaveProperty('role', 'customer');
    });

    it('should reject wrong OTP', async () => {
      await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: testPhone, otp: '000000' })
        .expect(401);
    });

    it('should reject OTP that is not 6 digits', async () => {
      await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: testPhone, otp: '1234' })
        .expect(400);
    });

    it('should not reveal if account exists (generic error)', async () => {
      const wrongPhone = '+919800000099';
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: wrongPhone, otp: '123456' })
        .expect(401);

      // Should not reveal account enumeration info
      expect(res.body.error).not.toContain('user');
      expect(res.body.error).not.toContain('account');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and revoke session', async () => {
      // Login first
      await request(app).post('/api/v1/auth/request-otp').send({ phone: testPhone });
      const loginRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: testPhone, otp: '123456' });

      const token = loginRes.body.token;

      // Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Token should now be invalid
      await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('should require authentication to logout', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });
});

describe('Health Check', () => {
  it('should return ok status', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('BottleBazaar API');
  });
});

describe('Security Tests', () => {
  it('should reject requests to admin endpoint without auth', async () => {
    await request(app)
      .get('/api/v1/admin/dashboard')
      .expect(401);
  });

  it('should return 404 for unknown routes', async () => {
    await request(app)
      .get('/api/v1/nonexistent')
      .expect(404);
  });

  it('should set security headers', async () => {
    const res = await request(app).get('/health');
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
  });
});
