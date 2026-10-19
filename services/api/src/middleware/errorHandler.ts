// =====================================================
// Error Types and Global Error Handler
// =====================================================
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
  }
}

// Global error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn({
      code: err.code,
      statusCode: err.statusCode,
      requestId: req.headers['x-request-id'],
      url: req.url,
      method: req.method,
    }, err.message);

    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
      requestId: req.headers['x-request-id'],
    });
    return;
  }

  // Unexpected errors — don't expose internals
  logger.error({
    err,
    requestId: req.headers['x-request-id'],
    url: req.url,
    method: req.method,
  }, 'Unhandled error');

  res.status(500).json({
    error: 'An unexpected error occurred. Please try again later.',
    code: 'INTERNAL_ERROR',
    requestId: req.headers['x-request-id'],
  });
}
