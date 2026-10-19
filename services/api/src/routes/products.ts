// =====================================================
// Products Routes
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getPool } from '../db/pool';
import { authenticate, requireAdmin, requireStoreOwner, optionalAuth } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { cacheGet, cacheSet } from '../cache/redis';
import { paginateQuery, paginate } from '../utils/pagination';

const router = Router();

const CreateProductSchema = z.object({
  categoryId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  name: z.string().min(2).max(200),
  nameHi: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  descriptionHi: z.string().max(2000).optional(),
  abv: z.number().min(0).max(100).optional(),
  volumeMl: z.number().int().positive().optional(),
  packSize: z.string().max(50).optional(),
});

// ── GET /products — catalog listing ──────────────────
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, brand, page = '1', limit = '20', q } = req.query;
    const { offset, pageSize } = paginateQuery(page as string, limit as string);
    const pool = getPool();

    const params: unknown[] = [];
    let idx = 1;
    let where = 'p.is_active = true';

    if (category) { where += ` AND c.slug = $${idx++}`; params.push(category); }
    if (brand) { where += ` AND b.name ILIKE $${idx++}`; params.push(`%${brand}%`); }
    if (q) {
      where += ` AND (p.name ILIKE $${idx} OR p.name_hi ILIKE $${idx})`;
      params.push(`%${q}%`);
      idx++;
    }

    const { rows } = await pool.query(`
      SELECT p.id, p.name, p.name_hi, p.description, p.image_url,
             p.volume_ml, p.pack_size, p.abv, p.updated_at,
             c.name as category_name, c.slug as category_slug, c.id as category_id,
             b.name as brand_name, b.id as brand_id,
             COUNT(sp.id) as store_count,
             MIN(sp.price_paise) as min_price_paise,
             MAX(sp.price_paise) as max_price_paise
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN store_products sp ON sp.product_id = p.id AND sp.in_stock = true
      LEFT JOIN stores s ON sp.store_id = s.id AND s.status = 'approved'
      WHERE ${where}
      GROUP BY p.id, c.name, c.slug, c.id, b.name, b.id
      ORDER BY p.name
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, pageSize, offset]);

    const totalRes = await pool.query(
      `SELECT COUNT(*) FROM products p JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id WHERE ${where}`, params
    );

    res.json({
      data: rows,
      pagination: paginate(parseInt(totalRes.rows[0].count), parseInt(page as string), pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /products/:id — product detail ───────────────
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const cacheKey = `product:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             b.name as brand_name, b.origin as brand_origin
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = $1 AND p.is_active = true
    `, [id]);

    if (rows.length === 0) throw new NotFoundError('Product');

    // Get stores carrying this product
    const { rows: stores } = await pool.query(`
      SELECT sp.price_paise, sp.in_stock, sp.last_updated,
             s.id as store_id, s.name as store_name, s.city, s.pin_code, s.opening_hours
      FROM store_products sp
      JOIN stores s ON sp.store_id = s.id AND s.status = 'approved'
      WHERE sp.product_id = $1
      ORDER BY sp.price_paise ASC NULLS LAST
      LIMIT 20
    `, [id]);

    const result = { ...rows[0], availableAt: stores };
    await cacheSet(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── POST /products — admin creates product ────────────
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateProductSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid product data', parsed.error.flatten());

    const data = parsed.data;
    const pool = getPool();

    const { rows } = await pool.query(`
      INSERT INTO products (category_id, brand_id, name, name_hi, description, description_hi, abv, volume_ml, pack_size)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id, name, created_at
    `, [
      data.categoryId, data.brandId || null, data.name, data.nameHi || null,
      data.description || null, data.descriptionHi || null,
      data.abv || null, data.volumeMl || null, data.packSize || null,
    ]);

    res.status(201).json({ message: 'Product created', product: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
