// =====================================================
// BottleBazaar API — Main Entry Point
// =====================================================
import 'dotenv/config';
import { createApp } from './app';
import { getPool } from './db/pool';
import { getRedis } from './cache/redis';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function main() {
  // Verify DB connection
  const pool = getPool();
  try {
    await pool.query('SELECT 1');
    logger.info('PostgreSQL connected');
  } catch (err) {
    logger.error({ err }, 'PostgreSQL connection failed — exiting');
    process.exit(1);
  }

  // Verify Redis connection
  try {
    const redis = getRedis();
    await redis.ping();
    logger.info('Redis connected');
  } catch (err) {
    logger.error({ err }, 'Redis connection failed — exiting');
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info(`BottleBazaar API listening on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal} — shutting down gracefully`);
    server.close(async () => {
      await pool.end();
      const redis = getRedis();
      redis.disconnect();
      logger.info('Server closed cleanly');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
