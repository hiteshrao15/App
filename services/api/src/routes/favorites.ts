// =====================================================
// Favorites Routes
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getPool } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

const FavoriteSchema = z.object({
  productId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
}).refine(d => d.productId || d.storeId, {
  message: 'Either productId or storeId is required',
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT f.id, f.created_at,
             p.id as product_id, p.name as product_name, p.image_url, p.volume_ml,
             s.id as store_id, s.name as store_name, s.city
      FROM favorites f
      LEFT JOIN products p ON f.product_id = p.id
      LEFT JOIN stores s ON f.store_id = s.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [req.user!.id]);

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = FavoriteSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

    const pool = getPool();
    await pool.query(`
      INSERT INTO favorites (user_id, product_id, store_id)
      VALUES ($1, $2, $3) ON CONFLICT DO NOTHING
    `, [req.user!.id, parsed.data.productId || null, parsed.data.storeId || null]);

    res.status(201).json({ message: 'Added to favorites' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    await pool.query(
      `DELETE FROM favorites WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id]
    );
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    next(err);
  }
});

export default router;
