// =====================================================
// Notifications Routes
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { getPool } from '../db/pool';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT id, type, title, body, data, read, created_at
      FROM notifications WHERE user_id = $1
      ORDER BY created_at DESC LIMIT 50
    `, [req.user!.id]);
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
      [req.user!.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

export default router;
