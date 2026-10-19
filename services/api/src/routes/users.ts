// =====================================================
// Users Routes — Profile & age declaration
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getPool } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  language: z.enum(['en', 'hi']).optional(),
});

// ── GET /users/me ─────────────────────────────────────
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT id, phone, country_code, role, status, display_name, language,
             age_declared, age_declared_at, created_at
      FROM users WHERE id = $1
    `, [req.user!.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /users/me ───────────────────────────────────
router.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (parsed.data.displayName !== undefined) {
      updates.push(`display_name = $${idx++}`);
      params.push(parsed.data.displayName);
    }
    if (parsed.data.language !== undefined) {
      updates.push(`language = $${idx++}`);
      params.push(parsed.data.language);
    }

    if (updates.length === 0) throw new ValidationError('No fields to update');

    params.push(req.user!.id);
    const pool = getPool();
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, params);

    res.json({ message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
});

// ── POST /users/me/declare-age — age self-declaration ─
router.post('/me/declare-age', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { confirmed } = z.object({ confirmed: z.literal(true) }).parse(req.body);
    const pool = getPool();

    await pool.query(`
      UPDATE users SET age_declared = true, age_declared_at = NOW() WHERE id = $1
    `, [req.user!.id]);

    // Record consent
    await pool.query(`
      INSERT INTO user_consents (user_id, policy_type, policy_version, accepted, ip_address)
      VALUES ($1, 'age_gate', '1.0', true, $2::inet)
    `, [req.user!.id, req.ip]);

    res.json({
      message: 'Age declaration recorded',
      legalNotice: 'This is a self-declaration only. It does not substitute for legal age verification required by applicable law.',
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /users/me — account deletion request ───────
router.delete('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE users SET status = 'pending_deletion' WHERE id = $1`,
      [req.user!.id]
    );
    res.json({
      message: 'Account deletion requested. Your account will be processed within 30 days in accordance with our privacy policy.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
