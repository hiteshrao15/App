// =====================================================
// Categories Routes
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { getPool } from '../db/pool';
import { cacheGet, cacheSet } from '../cache/redis';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'categories:all';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(Array.isArray(cached) ? { data: cached } : cached);
    }

    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT id, slug, name, name_hi, description, icon_url, sort_order
      FROM categories WHERE is_active = true ORDER BY sort_order, name
    `);

    const result = { data: rows };
    await cacheSet(cacheKey, result, 3600); // 1 hour cache
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
