# Existing BottleBazaar Technology Stack

- Languages: TypeScript 5.5, JavaScript bootstrap files; React/TSX.
- Runtime/tooling: Node.js >=20, npm >=10, npm workspaces; TypeScript compiler; Jest/ts-jest; ESLint.
- Mobile: Expo SDK 57 / React Native (see `apps/mobile/package.json`), Expo Router-free screen navigation in `App.tsx`.
- Admin: React with Vite and MUI (see `apps/admin/package.json` and `vite.config.ts`).
- API: Express 4.19, `cors`, `helmet`, `compression`, `morgan`, `express-rate-limit`, `multer`, `swagger-ui-express`.
- Persistence: PostgreSQL via `pg` (migration SQL in `services/api/src/db/migrations/001_initial_schema.sql`); Redis 7 via `ioredis`.
- Auth/security: bcryptjs OTP hashes, JWT (`jsonwebtoken`), session table, zod/Joi validation, audit service.
- Integrations: MSG91 SMS service (`services/api/src/services/sms.ts`); Twilio dependency/types are present; uploads use Multer/local filesystem.
- API docs: swagger-jsdoc and swagger-ui-express.
- Build commands: root `npm run build` delegates workspace builds; API `tsc`; admin Vite build; mobile Expo package has platform-specific scripts.
- Runtime configuration: `.env`/`.env.example` controls `PORT`, database/Redis URLs, CORS, JWT, OTP provider, rate limits, upload directory and API base URLs.
- Existing migration blockers: API is synchronous Express/SQL with route-local queries; client contracts are REST `/api/v1`; database uses PostgreSQL enums/JSONB/UUID and exact paise integer fields; Redis rate limiting/cache semantics are observable.
