// =====================================================
// OpenAPI / Swagger Spec
// =====================================================
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BottleBazaar API',
      version: '1.0.0',
      description: `
## BottleBazaar API — Liquor Discovery & In-Store Discount Marketplace

This API powers the BottleBazaar mobile app and admin dashboard.

### Authentication
Most endpoints require a Bearer JWT token. Obtain it via the \`/api/v1/auth/verify-otp\` endpoint.

### Development Mode
- OTP is always \`123456\` when \`NODE_ENV=development\`
- No real SMS is sent in development

### Legal Notice
All endpoints respect Indian state-specific liquor regulations and age restrictions.
      `,
      contact: {
        name: 'BottleBazaar Support',
        email: 'support@bottlebazaar.in',
      },
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Local Development' },
      { url: 'https://api.bottlebazaar.in', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
