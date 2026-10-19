// =====================================================
// Stores Routes — Discovery, management, admin approval
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getPool } from '../db/pool';
import { authenticate, requireAdmin, requireStoreOwner, optionalAuth } from '../middleware/auth';
import { NotFoundError, ForbiddenError, ValidationError, AppError } from '../middleware/errorHandler';
import { auditLog } from '../services/audit';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../cache/redis';
import { paginate, paginateQuery } from '../utils/pagination';
import { logger } from '../utils/logger';

const router = Router();

const CreateStoreSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  addressLine1: z.string().min(5).max(300),
  addressLine2: z.string().max(300).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pinCode: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  licenseNumber: z.string().max(100).optional(),
  licenseType: z.string().max(100).optional(),
  openingHours: z.record(z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().optional(),
  })).optional(),
});

const UpdateStoreSchema = CreateStoreSchema.partial();

// ── GET /stores — public discovery ───────────────────
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = '10', city, pinCode, page = '1', limit = '20', q } = req.query;
    const pool = getPool();
    const { offset, pageSize } = paginateQuery(page as string, limit as string);

    let query = `
      SELECT s.id, s.name, s.address_line1, s.city, s.state, s.pin_code,
             s.latitude, s.longitude, s.phone, s.email, s.opening_hours,
             s.status, s.updated_at,
             j.state_code, j.state_name,
             COUNT(sp.id) as product_count,
             COUNT(o.id) as active_offers
      FROM stores s
      LEFT JOIN jurisdictions j ON s.jurisdiction_id = j.id
      LEFT JOIN store_products sp ON sp.store_id = s.id
      LEFT JOIN offers o ON o.store_id = s.id AND o.status = 'approved'
        AND o.valid_from <= NOW() AND o.valid_until > NOW()
      WHERE s.status = 'approved'
    `;
    const params: unknown[] = [];
    let paramIdx = 1;

    if (q) {
      query += ` AND (s.name ILIKE $${paramIdx} OR s.city ILIKE $${paramIdx})`;
      params.push(`%${q}%`);
      paramIdx++;
    }
    if (city) {
      query += ` AND s.city ILIKE $${paramIdx}`;
      params.push(`%${city}%`);
      paramIdx++;
    }
    if (pinCode) {
      query += ` AND s.pin_code = $${paramIdx}`;
      params.push(pinCode);
      paramIdx++;
    }

    // Location-based query
    if (lat && lng) {
      const radiusKm = Math.min(parseFloat(radius as string), 50); // max 50km
      query += ` AND earth_distance(ll_to_earth(s.latitude, s.longitude), ll_to_earth($${paramIdx}, $${paramIdx + 1})) <= $${paramIdx + 2} * 1000`;
      params.push(parseFloat(lat as string), parseFloat(lng as string), radiusKm);
      paramIdx += 3;
    }

    query += ` GROUP BY s.id, j.state_code, j.state_name ORDER BY s.name LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(pageSize, offset);

    const { rows } = await pool.query(query, params);

    // Count
    const countQuery = query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM').split('GROUP BY')[0];
    // Simple total
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM stores s WHERE s.status = 'approved'
      ${city ? `AND s.city ILIKE '%${city}%'` : ''}
      ${pinCode ? `AND s.pin_code = '${pinCode}'` : ''}
    `);

    res.json({
      data: rows,
      pagination: paginate(parseInt(totalResult.rows[0].total), parseInt(page as string), pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /stores/:id — public store detail ─────────────
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const cacheKey = `store:${id}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) return res.json(cached);

    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT s.*, j.state_code, j.state_name, j.min_age,
             u.display_name as owner_name
      FROM stores s
      LEFT JOIN jurisdictions j ON s.jurisdiction_id = j.id
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE s.id = $1 AND s.status = 'approved'
    `, [id]);

    if (rows.length === 0) throw new NotFoundError('Store');

    const store = rows[0];
    // Remove private fields
    delete store.license_doc_url;
    delete store.owner_id;
    delete store.approved_by;

    await cacheSet(cacheKey, store, 300); // cache 5 min
    res.json(store);
  } catch (err) {
    next(err);
  }
});

// ── GET /stores/:id/products — public ────────────────
router.get('/:id/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;
    const { offset, pageSize } = paginateQuery(page as string, limit as string);
    const pool = getPool();

    const { rows } = await pool.query(`
      SELECT sp.id, sp.price_paise, sp.in_stock, sp.last_updated,
             p.id as product_id, p.name, p.name_hi, p.description, p.image_url,
             p.volume_ml, p.pack_size, p.abv,
             c.name as category_name, c.slug as category_slug,
             b.name as brand_name
      FROM store_products sp
      JOIN products p ON sp.product_id = p.id AND p.is_active = true
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE sp.store_id = $1
      ORDER BY c.sort_order, p.name
      LIMIT $2 OFFSET $3
    `, [id, pageSize, offset]);

    res.json({ data: rows, storeId: id });
  } catch (err) {
    next(err);
  }
});

// ── POST /stores — store owner registration ───────────
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    if (!user) throw new Error('No user');

    // Allow customers to register as store owners
    const parsed = CreateStoreSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid store data', parsed.error.flatten());

    const data = parsed.data;
    const pool = getPool();

    // Check if this phone already has a pending/approved store
    const { rows: existing } = await pool.query(
      `SELECT id FROM stores WHERE owner_id = $1 AND status NOT IN ('rejected') LIMIT 1`,
      [user.id]
    );
    if (existing.length > 0) {
      throw new AppError(409, 'DUPLICATE_STORE', 'You already have a store registration pending or approved.');
    }

    // Find jurisdiction
    const { rows: jRows } = await pool.query(
      `SELECT id FROM jurisdictions WHERE state_name ILIKE $1 AND is_active = true LIMIT 1`,
      [data.state]
    );
    const jurisdictionId = jRows[0]?.id;
    if (!jurisdictionId) {
      throw new ValidationError(`State "${data.state}" is not currently supported.`);
    }

    const { rows } = await pool.query(`
      INSERT INTO stores (
        owner_id, jurisdiction_id, name, description,
        address_line1, address_line2, city, state, pin_code,
        phone, email, latitude, longitude,
        license_number, license_type, opening_hours, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'pending')
      RETURNING id, name, status, created_at
    `, [
      user.id, jurisdictionId, data.name, data.description || null,
      data.addressLine1, data.addressLine2 || null, data.city, data.state, data.pinCode,
      data.phone || null, data.email || null,
      data.latitude || null, data.longitude || null,
      data.licenseNumber || null, data.licenseType || null,
      data.openingHours ? JSON.stringify(data.openingHours) : null,
    ]);

    // Upgrade user role to store_owner if still customer
    if (user.role === 'customer') {
      await pool.query(`UPDATE users SET role = 'store_owner' WHERE id = $1`, [user.id]);
    }

    await auditLog({
      action: 'store.create',
      actorId: user.id,
      actorRole: user.role,
      targetType: 'store',
      targetId: rows[0].id,
      metadata: { storeName: data.name, city: data.city },
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: 'Store registration submitted for review. You will be notified when approved.',
      store: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /stores/my/store — owner's own store ──────────
router.get('/my/store', authenticate, requireStoreOwner, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT s.*, j.state_code, j.state_name
      FROM stores s
      LEFT JOIN jurisdictions j ON s.jurisdiction_id = j.id
      WHERE s.owner_id = $1
      ORDER BY s.created_at DESC
    `, [user!.id]);

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// ── PUT /stores/:id — owner updates own store ─────────
router.put('/:id', authenticate, requireStoreOwner, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const pool = getPool();

    // Verify ownership
    const { rows: storeRows } = await pool.query(
      `SELECT owner_id, status FROM stores WHERE id = $1`, [id]
    );
    if (storeRows.length === 0) throw new NotFoundError('Store');
    if (storeRows[0].owner_id !== user!.id && user!.role !== 'admin' && user!.role !== 'super_admin') {
      throw new ForbiddenError('You do not own this store');
    }

    const parsed = UpdateStoreSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid data', parsed.error.flatten());

    const data = parsed.data;
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      name: 'name', description: 'description',
      addressLine1: 'address_line1', addressLine2: 'address_line2',
      city: 'city', state: 'state', pinCode: 'pin_code',
      phone: 'phone', email: 'email',
      latitude: 'latitude', longitude: 'longitude',
      licenseNumber: 'license_number', licenseType: 'license_type',
      openingHours: 'opening_hours',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key as keyof typeof data] !== undefined) {
        const val = data[key as keyof typeof data];
        updates.push(`${col} = $${idx}`);
        params.push(key === 'openingHours' ? JSON.stringify(val) : val);
        idx++;
      }
    }

    if (updates.length === 0) throw new ValidationError('No fields to update');

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE stores SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, name, status, updated_at`,
      params
    );

    await cacheDel(`store:${id}`);

    res.json({ message: 'Store updated', store: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
