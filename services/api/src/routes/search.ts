// =====================================================
// Search Routes — Debounced full-text product & store search
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getPool } from '../db/pool';
import { cacheGet, cacheSet } from '../cache/redis';
import { paginateQuery } from '../utils/pagination';

const router = Router();

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many search requests', code: 'RATE_LIMIT_EXCEEDED' },
});

// ── GET /search — unified product + store search ──────
router.get('/', searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, type = 'all', city, page = '1', limit = '20' } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json({ products: [], stores: [], offers: [] });
    }

    const searchTerm = q.trim().substring(0, 100); // cap at 100 chars
    const cacheKey = `search:${type}:${searchTerm}:${city || ''}:${page}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const pool = getPool();
    const { offset, pageSize } = paginateQuery(page as string, limit as string);
    const results: Record<string, unknown[]> = { products: [], stores: [], offers: [] };

    const like = `%${searchTerm}%`;

    if (type === 'all' || type === 'products') {
      const { rows } = await pool.query(`
        SELECT p.id, p.name, p.name_hi, p.image_url, p.volume_ml, p.pack_size,
               c.name as category_name, c.slug as category_slug, b.name as brand_name,
               COUNT(sp.id) as store_count, MIN(sp.price_paise) as min_price_paise
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN store_products sp ON sp.product_id = p.id AND sp.in_stock = true
        LEFT JOIN stores s ON sp.store_id = s.id AND s.status = 'approved'
        WHERE p.is_active = true AND (
          p.name ILIKE $1 OR p.name_hi ILIKE $1
          OR b.name ILIKE $1 OR c.name ILIKE $1
        )
        GROUP BY p.id, c.name, c.slug, b.name
        ORDER BY p.name LIMIT $2 OFFSET $3
      `, [like, Math.min(pageSize, 10), offset]);
      results.products = rows;
    }

    if (type === 'all' || type === 'stores') {
      const params: unknown[] = [like];
      let cityFilter = '';
      if (city) { cityFilter = ` AND s.city ILIKE $2`; params.push(`%${city}%`); }

      const { rows } = await pool.query(`
        SELECT s.id, s.name, s.address_line1, s.city, s.state, s.pin_code,
               s.latitude, s.longitude, s.opening_hours,
               COUNT(o.id) as active_offers
        FROM stores s
        LEFT JOIN offers o ON o.store_id = s.id AND o.status = 'approved'
          AND o.valid_until > NOW()
        WHERE s.status = 'approved' AND s.name ILIKE $1
        ${cityFilter}
        GROUP BY s.id
        ORDER BY s.name LIMIT 10
      `, params);
      results.stores = rows;
    }

    if (type === 'all' || type === 'offers') {
      const { rows } = await pool.query(`
        SELECT o.id, o.title, o.title_hi, o.offer_type, o.offer_price_paise,
               o.discount_percent, o.valid_until,
               s.name as store_name, s.city,
               p.name as product_name, p.image_url
        FROM offers o
        JOIN stores s ON o.store_id = s.id AND s.status = 'approved'
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.status = 'approved' AND o.valid_until > NOW()
          AND (o.title ILIKE $1 OR o.description ILIKE $1 OR p.name ILIKE $1)
        ORDER BY o.valid_until ASC LIMIT 10
      `, [like]);
      results.offers = rows;
    }

    await cacheSet(cacheKey, results, 60); // 1 min cache for searches
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// ── GET /search/suggestions — autocomplete ────────────
router.get('/suggestions', searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 1) {
      return res.json({ suggestions: [] });
    }

    const term = q.trim().substring(0, 50);
    const pool = getPool();

    const { rows: products } = await pool.query(`
      SELECT name as text, 'product' as type FROM products
      WHERE is_active = true AND name ILIKE $1 LIMIT 5
    `, [`${term}%`]);

    const { rows: brands } = await pool.query(`
      SELECT name as text, 'brand' as type FROM brands
      WHERE is_active = true AND name ILIKE $1 LIMIT 3
    `, [`${term}%`]);

    const { rows: stores } = await pool.query(`
      SELECT name as text, 'store' as type FROM stores
      WHERE status = 'approved' AND name ILIKE $1 LIMIT 3
    `, [`${term}%`]);

    res.json({ suggestions: [...products, ...brands, ...stores] });
  } catch (err) {
    next(err);
  }
});

export default router;
