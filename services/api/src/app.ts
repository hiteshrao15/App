// =====================================================
// BottleBazaar API — Express App Factory
// =====================================================
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { sanitizeInput } from './middleware/sanitize';

// Route imports
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import storesRouter from './routes/stores';
import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import offersRouter from './routes/offers';
import redemptionsRouter from './routes/redemptions';
import favoritesRouter from './routes/favorites';
import notificationsRouter from './routes/notifications';
import adminRouter from './routes/admin';
import searchRouter from './routes/search';
import configRouter from './routes/config';
import uploadRouter from './routes/uploads';

export function createApp(): Express {
  const app = express();

  // ── Security middleware ──────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:19006')
    .split(',')
    .map(o => o.trim());

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }));

  // ── Parse & compress ─────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(compression());

  // ── Request tracking ─────────────────────────────────
  app.use(requestId);

  // ── Logging ──────────────────────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    }));
  }

  // ── Input sanitization ───────────────────────────────
  app.use(sanitizeInput);

  // ── Global rate limiter ──────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_GLOBAL || '500', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  });
  app.use(globalLimiter);

  // ── API Documentation ─────────────────────────────────
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  // ── Routes ────────────────────────────────────────────
  app.use('/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/stores', storesRouter);
  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/categories', categoriesRouter);
  app.use('/api/v1/offers', offersRouter);
  app.use('/api/v1/redemptions', redemptionsRouter);
  app.use('/api/v1/favorites', favoritesRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/search', searchRouter);
  app.use('/api/v1/config', configRouter);
  app.use('/api/v1/uploads', uploadRouter);
  app.use('/api/v1/admin', adminRouter);

  // ── Static file serving for uploads ──────────────────
  app.use('/uploads', express.static('uploads'));

  // ── 404 handler ───────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  });

  // ── Global error handler ──────────────────────────────
  app.use(errorHandler);

  return app;
}
