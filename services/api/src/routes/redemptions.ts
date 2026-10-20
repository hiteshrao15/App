// =====================================================
// Redemption Routes — Secure token issuance & validation
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { getPool, withTransaction } from '../db/pool';
import { authenticate, requireStoreOwner } from '../middleware/auth';
import { NotFoundError, ForbiddenError, AppError, ValidationError } from '../middleware/errorHandler';
import { auditLog } from '../services/audit';
import { checkRateLimit } from '../cache/redis';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const IssueTokenSchema = z.object({
  offerId: z.string().uuid(),
  storeId: z.string().uuid(),
});

const ValidateTokenSchema = z.object({
  token: z.string().min(10).max(200),
  storeId: z.string().uuid(),
});

// ── POST /redemptions/issue — customer requests token ─
router.post('/issue', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    const parsed = IssueTokenSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid request', parsed.error.flatten());

    const { offerId, storeId } = parsed.data;

    // Rate limit: 10 token requests per user per hour
    const rateResult = await checkRateLimit(`redeem:user:${user!.id}`, 3600, 10);
    if (!rateResult.allowed) {
      throw new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many redemption requests. Try again later.');
    }

    const pool = getPool();

    // Validate offer (server-side, never trust client)
    const { rows: offerRows } = await pool.query(`
      SELECT o.id, o.store_id, o.status, o.valid_from, o.valid_until,
             o.total_limit, o.per_customer_limit, o.redemption_count,
             s.status as store_status, j.min_age
      FROM offers o
      JOIN stores s ON o.store_id = s.id
      JOIN jurisdictions j ON s.jurisdiction_id = j.id
      WHERE o.id = $1
    `, [offerId]);

    if (offerRows.length === 0) throw new NotFoundError('Offer');
    const offer = offerRows[0];

    if (offer.status !== 'approved') throw new AppError(400, 'OFFER_UNAVAILABLE', 'Offer is not available');
    if (offer.store_status !== 'approved') throw new AppError(400, 'STORE_UNAVAILABLE', 'Store is not available');
    if (offer.store_id !== storeId) throw new AppError(400, 'STORE_MISMATCH', 'Offer not valid at this store');

    const now = new Date();
    if (now < new Date(offer.valid_from) || now > new Date(offer.valid_until)) {
      throw new AppError(400, 'OFFER_EXPIRED', 'Offer is not currently valid');
    }

    // Check user's age declaration
    const { rows: userRows } = await pool.query(
      `SELECT age_declared FROM users WHERE id = $1`, [user!.id]
    );
    if (!userRows[0]?.age_declared) {
      throw new AppError(403, 'AGE_GATE_REQUIRED', 'Please complete age verification first');
    }

    // Atomic redemption with transaction to prevent race conditions
    const token = await withTransaction(async (client) => {
      // Lock and check total limit
      if (offer.total_limit !== null) {
        const { rows: lockRows } = await client.query(
          `SELECT redemption_count FROM offers WHERE id = $1 FOR UPDATE`, [offerId]
        );
        if (lockRows[0].redemption_count >= offer.total_limit) {
          throw new AppError(400, 'OFFER_EXHAUSTED', 'Offer redemption limit reached');
        }
      }

      // Check per-customer limit
      const { rows: customerRows } = await client.query(`
        SELECT COUNT(*) as count FROM redemption_tokens
        WHERE offer_id = $1 AND user_id = $2 AND status IN ('issued', 'redeemed')
      `, [offerId, user!.id]);
      if (parseInt(customerRows[0].count) >= offer.per_customer_limit) {
        throw new AppError(400, 'CUSTOMER_LIMIT_REACHED', 'You have reached the limit for this offer');
      }

      // Generate cryptographically secure token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const tokenId = uuidv4();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

      await client.query(`
        INSERT INTO redemption_tokens (id, offer_id, user_id, store_id, token_hash, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [tokenId, offerId, user!.id, storeId, tokenHash, expiresAt]);

      // Increment offer redemption count
      await client.query(
        `UPDATE offers SET redemption_count = redemption_count + 1 WHERE id = $1`, [offerId]
      );

      return rawToken;
    });

    await auditLog({
      action: 'redemption.issue',
      actorId: user!.id,
      actorRole: user!.role,
      targetType: 'offer',
      targetId: offerId,
      metadata: { storeId, expiresIn: '30min' },
      ipAddress: req.ip,
    });

    res.json({
      token,
      message: 'Show this code to store staff. Valid for 30 minutes.',
      expiresIn: 1800, // seconds
      instructions: {
        en: 'Show this code to store staff for your discount. The code is single-use and expires in 30 minutes.',
        hi: 'छूट पाने के लिए यह कोड स्टोर स्टाफ को दिखाएं। यह कोड एकल-उपयोग है और 30 मिनट में समाप्त होता है।',
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /redemptions/validate — store staff validates ─
router.post('/validate', authenticate, requireStoreOwner, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    const parsed = ValidateTokenSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

    const { token, storeId } = parsed.data;

    // Rate limit on validation
    const rateResult = await checkRateLimit(`validate:store:${storeId}`, 60, 30);
    if (!rateResult.allowed) throw new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Validation rate limit exceeded');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const pool = getPool();

    // Atomic validation in transaction
    const result = await withTransaction(async (client) => {
      const { rows } = await client.query(`
        SELECT rt.id, rt.offer_id, rt.user_id, rt.store_id, rt.status, rt.expires_at,
               o.title, o.description, o.offer_type, o.offer_price_paise, o.discount_percent
        FROM redemption_tokens rt
        JOIN offers o ON rt.offer_id = o.id
        WHERE rt.token_hash = $1 FOR UPDATE
      `, [tokenHash]);

      if (rows.length === 0) throw new AppError(400, 'INVALID_TOKEN', 'Invalid redemption code');
      const rt = rows[0];

      // Verify store matches
      if (rt.store_id !== storeId) throw new AppError(400, 'STORE_MISMATCH', 'Code not valid at this store');

      // Verify not already used
      if (rt.status === 'redeemed') throw new AppError(400, 'ALREADY_REDEEMED', 'This code has already been used');
      if (rt.status === 'expired' || rt.status === 'cancelled') {
        throw new AppError(400, 'TOKEN_INVALID', 'This code is no longer valid');
      }

      // Verify expiry
      if (new Date() > new Date(rt.expires_at)) {
        await client.query(`UPDATE redemption_tokens SET status = 'expired' WHERE id = $1`, [rt.id]);
        throw new AppError(400, 'TOKEN_EXPIRED', 'This code has expired');
      }

      // Mark as redeemed
      await client.query(`
        UPDATE redemption_tokens
        SET status = 'redeemed', redeemed_at = NOW(), redeemed_by = $1
        WHERE id = $2
      `, [user!.id, rt.id]);

      return rt;
    });

    await auditLog({
      action: 'redemption.consume',
      actorId: user!.id,
      actorRole: user!.role,
      targetType: 'redemption',
      targetId: result.id,
      metadata: { offerId: result.offer_id, storeId },
      ipAddress: req.ip,
    });

    res.json({
      valid: true,
      message: 'Redemption successful! Apply the discount for the customer.',
      offer: {
        title: result.title,
        description: result.description,
        offerType: result.offer_type,
        offerPricePaise: result.offer_price_paise,
        discountPercent: result.discount_percent,
      },
      redeemedAt: new Date().toISOString(),
      legalNotice: 'Please verify customer age before completing the sale as required by applicable law.',
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /redemptions/history — customer's own history ─
router.get('/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    const { page = '1', limit = '20' } = req.query;
    const pool = getPool();
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { rows } = await pool.query(`
      SELECT rt.id, rt.offer_id, rt.status, rt.issued_at, rt.redeemed_at, rt.expires_at,
             o.title, o.offer_type,
             s.name as store_name, s.city as store_city
      FROM redemption_tokens rt
      JOIN offers o ON rt.offer_id = o.id
      JOIN stores s ON rt.store_id = s.id
      WHERE rt.user_id = $1
      ORDER BY rt.issued_at DESC
      LIMIT $2 OFFSET $3
    `, [user!.id, parseInt(limit as string), offset]);

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
