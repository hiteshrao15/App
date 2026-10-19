// =====================================================
// Config Routes — Public app configuration
// =====================================================
import { Router, Request, Response, NextFunction } from 'express';
import { getPool } from '../db/pool';
import { cacheGet, cacheSet } from '../cache/redis';

const router = Router();

// Public config keys (safe to expose to mobile app)
const PUBLIC_KEYS = [
  'delivery_enabled', 'delivery_coming_soon_message', 'delivery_coming_soon_message_hi',
  'age_gate_enabled', 'age_gate_min_age', 'ai_discovery_enabled',
  'maintenance_mode', 'maintenance_message',
  'supported_states', 'support_phone', 'support_email',
  'terms_version', 'privacy_version',
  'app_version_android', 'app_version_ios',
];

router.get('/public', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'config:public';
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT key, value FROM app_config WHERE key = ANY($1)
    `, [PUBLIC_KEYS]);

    const config = Object.fromEntries(rows.map(r => [r.key, r.value]));
    await cacheSet(cacheKey, config, 300); // 5 min cache
    res.json(config);
  } catch (err) {
    next(err);
  }
});

router.get('/jurisdictions', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'config:jurisdictions';
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT id, state_code, state_name, state_name_hi, min_age
      FROM jurisdictions WHERE is_active = true ORDER BY state_name
    `);

    await cacheSet(cacheKey, rows, 3600);
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
