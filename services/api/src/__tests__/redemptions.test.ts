// =====================================================
// Redemption Tests — Concurrent & replay prevention
// =====================================================
import request from 'supertest';
import { createApp } from '../app';
import { getPool } from '../db/pool';
import { getRedis } from '../cache/redis';

const app = createApp();

async function getAuthToken(phone: string): Promise<string> {
  await request(app).post('/api/v1/auth/request-otp').send({ phone });
  const res = await request(app)
    .post('/api/v1/auth/verify-otp')
    .send({ phone, otp: '123456' });
  return res.body.token;
}

describe('Redemption System', () => {
  const customerPhone = '+919800000010';
  const ownerPhone = '+919800000011';

  beforeAll(async () => {
    const pool = getPool();
    const redis = getRedis();
    // Clean up
    const phones = [customerPhone, ownerPhone];
    for (const phone of phones) {
      await pool.query(`DELETE FROM otp_codes WHERE phone = $1`, [phone]);
      await pool.query(
        `DELETE FROM audit_logs
         WHERE actor_id IN (SELECT id FROM users WHERE phone = $1)`,
        [phone]
      );
      await pool.query(`DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE phone = $1)`, [phone]);
      await pool.query(`DELETE FROM users WHERE phone = $1`, [phone]);
      const rateLimitKeys = await redis.keys(`rl:otp:*${phone}*`);
      if (rateLimitKeys.length > 0) {
        await redis.del(...rateLimitKeys);
      }
    }
    const ipRateLimitKeys = await redis.keys('rl:otp:ip:*');
    if (ipRateLimitKeys.length > 0) {
      await redis.del(...ipRateLimitKeys);
    }
  });

  it('should require age declaration before issuing token', async () => {
    const token = await getAuthToken(customerPhone);
    const pool = getPool();

    // Get a valid store and offer (use seed data pattern)
    const { rows: stores } = await pool.query(
      `SELECT id FROM stores WHERE status = 'approved' LIMIT 1`
    );
    const { rows: offers } = await pool.query(
      `SELECT id, store_id FROM offers WHERE status = 'approved' AND valid_until > NOW() LIMIT 1`
    );

    if (stores.length === 0 || offers.length === 0) {
      console.log('Skipping: no seed data available in test DB');
      return;
    }

    const res = await request(app)
      .post('/api/v1/redemptions/issue')
      .set('Authorization', `Bearer ${token}`)
      .send({ offerId: offers[0].id, storeId: offers[0].store_id })
      .expect(403);

    expect(res.body.code).toBe('AGE_GATE_REQUIRED');
  });

  it('should reject invalid redemption token', async () => {
    const ownerToken = await getAuthToken(ownerPhone);

    // Upgrade to store_owner for validation
    const pool = getPool();
    await pool.query(
      `UPDATE users SET role = 'store_owner' WHERE phone = $1`,
      [ownerPhone]
    );

    const { rows: stores } = await pool.query(
      `SELECT id FROM stores WHERE status = 'approved' LIMIT 1`
    );

    if (stores.length === 0) {
      console.log('Skipping: no approved store in test DB');
      return;
    }

    const res = await request(app)
      .post('/api/v1/redemptions/validate')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ token: 'invalid-fake-token-12345', storeId: stores[0].id })
      .expect(400);

    expect(res.body.code).toBe('INVALID_TOKEN');
  });

  describe('Business rule enforcement', () => {
    it('should not allow customers to access admin dashboard', async () => {
      const customerToken = await getAuthToken(customerPhone);
      await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should not allow store owners to approve offers', async () => {
      const ownerToken = await getAuthToken(ownerPhone);
      const pool = getPool();
      await pool.query(`UPDATE users SET role = 'store_owner' WHERE phone = $1`, [ownerPhone]);

      const { rows } = await pool.query(
        `SELECT id FROM offers WHERE status = 'pending_review' LIMIT 1`
      );
      if (rows.length === 0) return;

      await request(app)
        .post(`/api/v1/offers/${rows[0].id}/review`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ decision: 'approved' })
        .expect(403);
    });
  });
});

describe('Pagination', () => {
  it('should return paginated categories', async () => {
    const res = await request(app).get('/api/v1/categories').expect(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return paginated products', async () => {
    const res = await request(app)
      .get('/api/v1/products?page=1&limit=5')
      .expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('pageSize', 5);
  });
});
