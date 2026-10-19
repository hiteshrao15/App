// =====================================================
// Admin Routes — Comprehensive admin dashboard API
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getPool } from '../db/pool';
import { authenticate, requireAdmin, requireModerator } from '../middleware/auth';
import { NotFoundError, ValidationError, ForbiddenError } from '../middleware/errorHandler';
import { auditLog } from '../services/audit';
import { cacheDel, cacheDelPattern } from '../cache/redis';
import { paginateQuery, paginate } from '../utils/pagination';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// ── GET /admin/dashboard — summary metrics ────────────
router.get('/dashboard', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const [stores, offers, users, redemptions] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') as pending_stores,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_stores,
          COUNT(*) FILTER (WHERE status = 'suspended') as suspended_stores
        FROM stores
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending_review') as pending_offers,
          COUNT(*) FILTER (WHERE status = 'approved' AND valid_until > NOW()) as active_offers,
          COUNT(*) FILTER (WHERE status = 'approved' AND valid_until < NOW()) as expired_offers
        FROM offers
      `),
      pool.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE role = 'customer') as customers,
          COUNT(*) FILTER (WHERE role = 'store_owner') as store_owners,
          COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users
        FROM users
      `),
      pool.query(`
        SELECT
          COUNT(*) as total_redemptions,
          COUNT(*) FILTER (WHERE status = 'redeemed') as successful_redemptions,
          COUNT(*) FILTER (WHERE issued_at > NOW() - INTERVAL '24 hours') as last_24h
        FROM redemption_tokens
      `),
    ]);

    res.json({
      stores: stores.rows[0],
      offers: offers.rows[0],
      users: users.rows[0],
      redemptions: redemptions.rows[0],
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /admin/stores — all stores with filters ────────
router.get('/stores', requireModerator, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20', q } = req.query;
    const { offset, pageSize } = paginateQuery(page as string, limit as string);
    const pool = getPool();

    const params: unknown[] = [];
    let idx = 1;
    let where = '1=1';

    if (status) { where += ` AND s.status = $${idx++}`; params.push(status); }
    if (q) { where += ` AND (s.name ILIKE $${idx} OR s.city ILIKE $${idx})`; params.push(`%${q}%`); idx++; }

    const { rows } = await pool.query(`
      SELECT s.id, s.name, s.city, s.state, s.pin_code, s.status,
             s.license_number, s.license_expiry, s.created_at, s.approved_at,
             s.rejection_reason,
             u.phone as owner_phone, u.display_name as owner_name,
             j.state_name
      FROM stores s
      JOIN users u ON s.owner_id = u.id
      LEFT JOIN jurisdictions j ON s.jurisdiction_id = j.id
      WHERE ${where}
      ORDER BY s.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, pageSize, offset]);

    const totalRes = await pool.query(
      `SELECT COUNT(*) FROM stores s WHERE ${where}`, params
    );

    res.json({
      data: rows,
      pagination: paginate(parseInt(totalRes.rows[0].count), parseInt(page as string), pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /admin/stores/:id/approve ────────────────────
router.post('/stores/:id/approve', requireModerator, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT owner_id, status FROM stores WHERE id = $1`, [id]
    );
    if (rows.length === 0) throw new NotFoundError('Store');

    // Business rule: owner cannot approve their own store
    if (rows[0].owner_id === user!.id) {
      throw new ForbiddenError('You cannot approve your own store');
    }

    await pool.query(
      `UPDATE stores SET status = 'approved', approved_by = $1, approved_at = NOW() WHERE id = $2`,
      [user!.id, id]
    );

    await cacheDel(`store:${id}`);

    await auditLog({
      action: 'store.approve',
      actorId: user!.id,
      actorRole: user!.role,
      targetType: 'store',
      targetId: id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Store approved' });
  } catch (err) {
    next(err);
  }
});

// ── POST /admin/stores/:id/reject ─────────────────────
router.post('/stores/:id/reject', requireModerator, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { reason } = z.object({ reason: z.string().min(10).max(500) }).parse(req.body);

    const pool = getPool();
    await pool.query(
      `UPDATE stores SET status = 'rejected', rejection_reason = $1 WHERE id = $2`,
      [reason, id]
    );

    await auditLog({
      action: 'store.reject',
      actorId: user!.id,
      actorRole: user!.role,
      targetType: 'store',
      targetId: id,
      metadata: { reason },
      ipAddress: req.ip,
    });

    res.json({ message: 'Store rejected' });
  } catch (err) {
    next(err);
  }
});

// ── POST /admin/stores/:id/suspend ────────────────────
router.post('/stores/:id/suspend', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { reason } = z.object({ reason: z.string().min(10).max(500) }).parse(req.body);

    const pool = getPool();
    await pool.query(
      `UPDATE stores SET status = 'suspended', suspended_at = NOW(), suspension_reason = $1 WHERE id = $2`,
      [reason, id]
    );

    // Suspend all active offers for this store
    await pool.query(
      `UPDATE offers SET status = 'suspended' WHERE store_id = $1 AND status = 'approved'`,
      [id]
    );

    await cacheDel(`store:${id}`);
    await cacheDelPattern('offers:*');

    await auditLog({
      action: 'store.suspend',
      actorId: user!.id,
      actorRole: user!.role,
      targetType: 'store',
      targetId: id,
      metadata: { reason },
      ipAddress: req.ip,
    });

    res.json({ message: 'Store suspended' });
  } catch (err) {
    next(err);
  }
});

// ── GET /admin/offers — moderation queue ──────────────
router.get('/offers', requireModerator, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'pending_review', page = '1', limit = '20' } = req.query;
    const { offset, pageSize } = paginateQuery(page as string, limit as string);
    const pool = getPool();

    const { rows } = await pool.query(`
      SELECT o.id, o.title, o.offer_type, o.status, o.valid_from, o.valid_until,
             o.original_price_paise, o.offer_price_paise, o.discount_percent,
             o.per_customer_limit, o.total_limit, o.redemption_count,
             o.submitted_at, o.review_notes, o.created_at,
             s.name as store_name, s.city,
             u.phone as owner_phone, u.display_name as owner_name,
             p.name as product_name
      FROM offers o
      JOIN stores s ON o.store_id = s.id
      JOIN users u ON o.created_by = u.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.status = $1
      ORDER BY o.submitted_at ASC NULLS LAST, o.created_at ASC
      LIMIT $2 OFFSET $3
    `, [status, pageSize, offset]);

    const totalRes = await pool.query(
      `SELECT COUNT(*) FROM offers WHERE status = $1`, [status]
    );

    res.json({
      data: rows,
      pagination: paginate(parseInt(totalRes.rows[0].count), parseInt(page as string), pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /admin/users — user management ────────────────
router.get('/users', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status, page = '1', limit = '20', q } = req.query;
    const { offset, pageSize } = paginateQuery(page as string, limit as string);
    const pool = getPool();

    const params: unknown[] = [];
    let idx = 1;
    let where = '1=1';

    if (role) { where += ` AND role = $${idx++}`; params.push(role); }
    if (status) { where += ` AND status = $${idx++}`; params.push(status); }
    if (q) { where += ` AND (phone ILIKE $${idx} OR display_name ILIKE $${idx})`; params.push(`%${q}%`); idx++; }

    const { rows } = await pool.query(`
      SELECT id, phone, country_code, role, status, display_name, language,
             age_declared, created_at, updated_at
      FROM users WHERE ${where}
      ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, pageSize, offset]);

    const totalRes = await pool.query(`SELECT COUNT(*) FROM users WHERE ${where}`, params);

    res.json({
      data: rows,
      pagination: paginate(parseInt(totalRes.rows[0].count), parseInt(page as string), pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /admin/users/:id/suspend ─────────────────────
router.post('/users/:id/suspend', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { user } = req;
    if (id === user!.id) throw new ForbiddenError('Cannot suspend your own account');

    const { reason } = z.object({ reason: z.string().min(5).max(500) }).parse(req.body);
    const pool = getPool();

    // Prevent suspending another admin
    const { rows } = await pool.query(`SELECT role FROM users WHERE id = $1`, [id]);
    if (rows.length === 0) throw new NotFoundError('User');
    if (['admin', 'super_admin'].includes(rows[0].role) && user!.role !== 'super_admin') {
      throw new ForbiddenError('Cannot suspend an admin user');
    }

    await pool.query(`UPDATE users SET status = 'suspended' WHERE id = $1`, [id]);

    await auditLog({
      action: 'user.suspend',
      actorId: user!.id,
      actorRole: user!.role,
      targetType: 'user',
      targetId: id,
      metadata: { reason },
      ipAddress: req.ip,
    });

    res.json({ message: 'User suspended' });
  } catch (err) {
    next(err);
  }
});

// ── GET /admin/audit-logs ─────────────────────────────
router.get('/audit-logs', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, targetType, page = '1', limit = '50' } = req.query;
    const { offset, pageSize } = paginateQuery(page as string, limit as string);
    const pool = getPool();

    const params: unknown[] = [];
    let idx = 1;
    let where = '1=1';

    if (action) { where += ` AND al.action = $${idx++}`; params.push(action); }
    if (targetType) { where += ` AND al.target_type = $${idx++}`; params.push(targetType); }

    const { rows } = await pool.query(`
      SELECT al.id, al.action, al.target_type, al.target_id, al.metadata,
             al.ip_address, al.request_id, al.created_at,
             u.phone as actor_phone, u.display_name as actor_name, al.actor_role
      FROM audit_logs al
      LEFT JOIN users u ON al.actor_id = u.id
      WHERE ${where}
      ORDER BY al.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, pageSize, offset]);

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// ── GET/POST /admin/config — app configuration ─────────
router.get('/config', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query(`SELECT key, value, description, updated_at FROM app_config ORDER BY key`);
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.put('/config/:key', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { user } = req;
    const { value } = z.object({ value: z.unknown() }).parse(req.body);

    // Restricted keys require super_admin
    const restrictedKeys = ['delivery_enabled', 'maintenance_mode', 'ai_discovery_enabled'];
    if (restrictedKeys.includes(key) && user!.role !== 'super_admin') {
      throw new ForbiddenError('This setting requires super_admin access');
    }

    const pool = getPool();
    await pool.query(`
      INSERT INTO app_config (key, value, updated_by, updated_at)
      VALUES ($1, $2::jsonb, $3, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_by = $3, updated_at = NOW()
    `, [key, JSON.stringify(value), user!.id]);

    await auditLog({
      action: 'config.change',
      actorId: user!.id,
      actorRole: user!.role,
      targetType: 'config',
      metadata: { key },
      ipAddress: req.ip,
    });

    res.json({ message: 'Configuration updated', key });
  } catch (err) {
    next(err);
  }
});

export default router;
