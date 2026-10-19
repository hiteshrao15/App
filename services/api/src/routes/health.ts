// =====================================================
// Health Check Routes
// =====================================================
import { Router, Request, Response } from 'express';
import { getPool } from '../db/pool';
import { getRedis } from '../cache/redis';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'BottleBazaar API',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check (DB + Redis)
 *     tags: [Health]
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};
  let allOk = true;

  try {
    await getPool().query('SELECT 1');
    checks.postgres = 'ok';
  } catch {
    checks.postgres = 'error';
    allOk = false;
  }

  try {
    await getRedis().ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
    allOk = false;
  }

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;
