// =====================================================
// Logger — Structured logging with Pino
// =====================================================
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.otp',
      'body.token',
      'body.password',
      'body.code',
      '*.otp',
      '*.password',
      '*.token',
      '*.code_hash',
    ],
    censor: '[REDACTED]',
  },
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
});
