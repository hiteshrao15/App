// =====================================================
// Offers Routes — Create, moderate, and retrieve offers
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getPool, withTransaction } from '../db/pool';
import { authenticate, requireAdmin, requireModerator, requireStoreOwner, optionalAuth } from '../middleware/auth';
import { NotFoundError, ForbiddenError, ValidationError, AppError } from '../middleware/errorHandler';
import { auditLog } from '../services/audit';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../cache/redis';
import { paginateQuery, paginate } from '../utils/pagination';

const router = Router();

const CreateOfferSchema = z.object({
  storeId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  title: z.string().min(5).max(200),
  titleHi: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  descriptionHi: z.string().max(2000).optional(),
  offerType: z.enum(['fixed_price', 'percentage_discount', 'custom']),
  originalPricePaise: z.number().int().positive().optional(),
  offerPricePaise: z.number().int().nonnegative().optional(),
  discountPercent: z.number().positive().max(100).optional(),
  customTerms: z.string().max(2000).optional(),
  minPurchasePaise: z.number().int().nonnegative().optional(),
  totalLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().max(10).default(1),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
}).refine(data => new Date(data.validUntil) > new Date(data.validFrom), {
  message: 'validUntil must be after validFrom',
  path: ['validUntil'],
}).refine(data => {
  if (data.offerType === 'fixed_price') return data.offerPricePaise !== undefined;
  if (data.offerType === 'percentage_discount') return data.discountPercent !== undefined;
  if (data.offerType === 'custom') return data.customTerms !== undefined;
  return true;
}, { message: 'Missing required fields for offer type' });

const ReviewOfferSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'suspended']),
  notes: z.string().max(1000).optional(),
});

// ── GET /offers — public approved offers ──────────────
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, productId, city, page = '1', limit = '20' } = req.query;
    const { offset, pageSize } = paginateQuery(page as string, limit as string);
    const pool = getPool();

    const params: unknown[] = [];
    let idx = 1;
    let where = `o.status = 'approved' AND o.valid_from <= NOW() AND o.valid_until > NOW()`;

    if (storeId) { where += ` AND o.store_id = $${idx++}`; params.push(storeId); }
    if (productId) { where += ` AND o.product_id = $${idx++}`; params.push(productId); }
    if (city) { where += ` AND s.city ILIKE $${idx++}`; params.push(`%${city}%`); }

    const { rows } = await pool.query(`
      SELECT o.id, o.title, o.title_hi, o.description, o.description_hi,
             o.offer_type, o.original_price_paise, o.offer_price_paise,
             o.discount_percent, o.custom_terms,
             o.per_customer_limit, o.total_limit, o.redemption_count,
             o.valid_from, o.valid_until, o.updated_at,
             s.id as store_id, s.name as store_name, s.city as store_city,
             p.id as product_id, p.name as product_name, p.image_url as product_image,
             p.volume_ml, p.pack_size
      FROM offers o
      JOIN stores s ON o.store_id = s.id AND s.status = 'approved'
      LEFT JOIN products p ON o.product_id = p.id
      WHERE ${where}
      ORDER BY o.valid_until ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, pageSize, offset]);

    const totalRes = await pool.query(`
      SELECT COUNT(*) FROM offers o JOIN stores s ON o.store_id = s.id
      WHERE ${where}
    `, params);

    res.json({
      data: rows,
      pagination: paginate(parseInt(totalRes.rows[0].count), parseInt(page as string), pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /offers/:id — public offer detail ─────────────
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const cacheKey = `offer:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT o.*, s.name as store_name, s.address_line1, s.city, s.pin_code,
             s.phone as store_phone, s.opening_hours,
             p.name as product_name, p.name_hi as product_name_hi,
             p.image_url, p.volume_ml, p.pack_size, p.abv,
             c.name as category_name
      FROM offers o
      JOIN stores s ON o.store_id = s.id AND s.status = 'approved'
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.id = $1 AND o.status = 'approved'
        AND o.valid_from <= NOW() AND o.valid_until > NOW()
    `, [id]);

    if (rows.length === 0) throw new NotFoundError('Offer');

    await cacheSet(cacheKey, rows[0], 120); // 2 min cache
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── POST /offers — store owner creates offer ──────────
router.post('/', authenticate, requireStoreOwner, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    const parsed = CreateOfferSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid offer data', parsed.error.flatten());

    const data = parsed.data;
    const pool = getPool();

    // Verify store ownership
    const { rows: storeRows } = await pool.query(
      `SELECT owner_id, status FROM stores WHERE id = $1`, [data.storeId]
    );
    if (storeRows.length === 0) throw new NotFoundError('Store');
    if (storeRows[0].owner_id !== user!.id && !['admin', 'super_admin'].includes(user!.role)) {
      throw new ForbiddenError('You do not own this store');
    }
    if (storeRows[0].status !== 'approved') {
      throw new AppError(403, 'STORE_NOT_APPROVED', 'Store must be approved before creating offers');
    }

    // Validate price sanity
    if (data.offerType === 'fixed_price' && data.originalPricePaise && data.offerPricePaise) {
      if (data.offerPricePaise > data.originalPricePaise) {
        throw new ValidationError('Offer price cannot be higher than original price');
      }
    }

    const { rows } = await pool.query(`
      INSERT INTO offers (
        store_id, product_id, created_by, title, title_hi,
        description, description_hi, offer_type,
        original_price_paise, offer_price_paise, discount_percent,
        custom_terms, min_purchase_paise, total_limit, per_customer_limit,
        valid_from, valid_until, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'draft')
      RETURNING id, title, status, created_at
    `, [
      data.storeId, data.productId || null, user!.id,
      data.title, data.titleHi || null,
      data.description || null, data.descriptionHi || null,
      data.offerType, data.originalPricePaise || null, data.offerPricePaise || null,
      data.discountPercent || null, data.customTerms || null,
      data.minPurchasePaise || null, data.totalLimit || null, data.perCustomerLimit,
      data.validFrom, data.validUntil,
    ]);

    await auditLog({
      action: 'offer.create',
      actorId: user!.id,
      actorRole: user!.role,
      targetType: 'offer',
      targetId: rows[0].id,
      metadata: { storeId: data.storeId, offerType: data.offerType },
    });

    res.status(201).json({ message: 'Offer created as draft', offer: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── POST /offers/:id/submit — submit for review ───────
router.post('/:id/submit', authenticate, requireStoreOwner, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT created_by, status, store_id FROM offers WHERE id = $1`, [id]
    );
    if (rows.length === 0) throw new NotFoundError('Offer');
    if (rows[0].created_by !== user!.id) throw new ForbiddenError('Not your offer');
    if (!['draft', 'rejected'].includes(rows[0].status)) {
      throw new AppError(409, 'INVALID_STATE', 'Offer cannot be submitted in current state');
    }

    await pool.query(
      `UPDATE offers SET status = 'pending_review', submitted_at = NOW() WHERE id = $1`,
      [id]
    );

    await auditLog({
      action: 'offer.submit',
      actorId: user!.id,
      actorRole: user!.role,
      targetType: 'offer',
      targetId: id,
    });

    res.json({ message: 'Offer submitted for review' });
  } catch (err) {
    next(err);
  }
});

// ── POST /offers/:id/review — admin/moderator reviews ─
router.post('/:id/review', authenticate, requireModerator, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const parsed = ReviewOfferSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid review data', parsed.error.flatten());

    const pool = getPool();
    const { rows: offerRows } = await pool.query(
      `SELECT created_by, status FROM offers WHERE id = $1`, [id]
    );
    if (offerRows.length === 0) throw new NotFoundError('Offer');
    if (offerRows[0].status !== 'pending_review') {
      throw new AppError(409, 'INVALID_STATE', 'Offer is not pending review');
    }

    // Business rule: reviewer cannot be the creator
    if (offerRows[0].created_by === user!.id) {
      throw new ForbiddenError('You cannot review your own offer');
    }

    const { decision, notes } = parsed.data;
    await pool.query(`
      UPDATE offers SET
        status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3,
        ${decision === 'suspended' ? 'suspended_at = NOW(), suspension_reason = $3' : ''}
      WHERE id = $4
    `, decision === 'suspended'
      ? [decision, user!.id, notes || null, id]
      : [decision, user!.id, notes || null, id]
    );

    // Invalidate cache
    await cacheDel(`offer:${id}`);
    await cacheDelPattern('offers:*');

    await auditLog({
      action: `offer.${decision}` as any,
      actorId: user!.id,
      actorRole: user!.role,
      targetType: 'offer',
      targetId: id,
      metadata: { decision, notes },
    });

    res.json({ message: `Offer ${decision}`, offerId: id });
  } catch (err) {
    next(err);
  }
});

// ── GET /offers/store/:storeId/mine — owner's own offers
router.get('/store/:storeId/mine', authenticate, requireStoreOwner, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;
    const { user } = req;
    const { page = '1', limit = '20', status } = req.query;
    const { offset, pageSize } = paginateQuery(page as string, limit as string);
    const pool = getPool();

    // Verify ownership
    const { rows: storeRows } = await pool.query(
      `SELECT owner_id FROM stores WHERE id = $1`, [storeId]
    );
    if (storeRows.length === 0) throw new NotFoundError('Store');
    if (storeRows[0].owner_id !== user!.id && !['admin', 'super_admin'].includes(user!.role)) {
      throw new ForbiddenError('Not your store');
    }

    const params: unknown[] = [storeId];
    let statusFilter = '';
    if (status) {
      params.push(status);
      statusFilter = ` AND o.status = $${params.length}`;
    }

    const { rows } = await pool.query(`
      SELECT o.id, o.title, o.offer_type, o.status, o.valid_from, o.valid_until,
             o.redemption_count, o.total_limit, o.review_notes, o.created_at, o.updated_at,
             p.name as product_name
      FROM offers o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.store_id = $1 ${statusFilter}
      ORDER BY o.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, pageSize, offset]);

    res.json({ data: rows, storeId });
  } catch (err) {
    next(err);
  }
});

export default router;
