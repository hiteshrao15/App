// =====================================================
// Redis Client (Singleton)
// =====================================================
import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis error');
    });

    redisClient.on('connect', () => {
      logger.debug('Redis connected');
    });
  }
  return redisClient;
}

// Rate-limit helper using Redis
export async function checkRateLimit(
  key: string,
  windowSeconds: number,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const redis = getRedis();
  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / (windowSeconds * 1000))}`;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, windowSeconds);
  }
  const ttl = await redis.ttl(windowKey);

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetIn: ttl,
  };
}

// Generic cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    logger.debug({ err, key }, 'Redis cacheGet failed, skipping cache');
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    const redis = getRedis();
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.debug({ err, key }, 'Redis cacheSet failed, skipping cache');
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch (err) {
    logger.debug({ err, key }, 'Redis cacheDel failed');
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.debug({ err, pattern }, 'Redis cacheDelPattern failed');
  }
}
