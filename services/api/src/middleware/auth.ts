// =====================================================
// Auth Middleware — JWT Verification + Role Guards
// =====================================================
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getPool } from '../db/pool';
import { getRedis } from '../cache/redis';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { logger } from '../utils/logger';

export type UserRole = 'customer' | 'store_owner' | 'moderator' | 'admin' | 'super_admin';

export interface AuthUser {
  id: string;
  phone: string;
  role: UserRole;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function signToken(payload: Omit<AuthUser, 'sessionId'> & { sessionId: string }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    issuer: 'bottlebazaar-api',
    audience: 'bottlebazaar-app',
  });
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    let payload: AuthUser;

    try {
      payload = jwt.verify(token, JWT_SECRET, {
        issuer: 'bottlebazaar-api',
        audience: 'bottlebazaar-app',
      }) as AuthUser;
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Check if session is revoked (Redis blacklist)
    const redis = getRedis();
    const revoked = await redis.get(`revoked:session:${payload.sessionId}`);
    if (revoked) {
      throw new UnauthorizedError('Session has been revoked');
    }

    // Verify user is still active in DB
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT id, role, status FROM users WHERE id = $1`,
      [payload.id]
    );

    if (rows.length === 0 || rows[0].status !== 'active') {
      throw new UnauthorizedError('Account is inactive or does not exist');
    }

    // Always use DB role (not token role) to prevent privilege manipulation
    req.user = {
      id: payload.id,
      phone: payload.phone,
      role: rows[0].role,
      sessionId: payload.sessionId,
    };

    next();
  } catch (err) {
    next(err);
  }
};

// Optional auth — sets req.user if token present, does not fail
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
};

// Role guard factory
export const requireRole = (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      logger.warn({
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        url: req.url,
      }, 'Unauthorized role access attempt');
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };

export const requireAdmin = requireRole('admin', 'super_admin');
export const requireModerator = requireRole('admin', 'super_admin', 'moderator');
export const requireStoreOwner = requireRole('store_owner', 'admin', 'super_admin');
