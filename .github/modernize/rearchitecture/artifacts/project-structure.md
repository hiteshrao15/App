# BottleBazaar Existing Project Structure

## Classification
Full-stack TypeScript monorepo: Expo mobile client, React/Vite admin web client, shared types package, and Express API service.

## Top-level modules and layers
- `apps/mobile`: Expo/React Native presentation, screen components, auth/location context, API client, theme/UI primitives.
- `apps/admin`: React/Vite presentation, route-level pages for dashboard, stores, offers, redemptions, dry days/settings, auth context, API client.
- `packages/types`: shared TypeScript declarations.
- `services/api`: Express HTTP adapter (`app.ts`, route modules), middleware, service helpers (SMS/audit), PostgreSQL pool/migrations/seeds, Redis cache.
- `infra`: Docker Compose for PostgreSQL/Redis/pgAdmin; `docs`: operational/API/domain documentation.

## Entry points
- API process: `services/api/src/index.ts:1` loads dotenv, verifies PostgreSQL and Redis, creates Express app, listens on `PORT` (default 4000).
- API composition: `services/api/src/app.ts:35` middleware stack; route mounts at lines 94-106; `/health` and `/api-docs`.
- Mobile: `apps/mobile/index.js` Expo registration and `apps/mobile/App.tsx` root navigation.
- Admin: `apps/admin/src/main.tsx` Vite bootstrap and `apps/admin/src/App.tsx` page routing.

## Functional domains
Auth/OTP and sessions; users/age declaration; jurisdiction/configuration; store registration and discovery; product/category catalog and store inventory; offers and moderation; in-store redemption; favorites/notifications; search; admin governance/audit/analytics; uploads.

## Layer observations
API routes combine request validation, authorization, SQL and response mapping. Middleware supplies security, auth, sanitization, request IDs and errors. Redis is used for rate limits/cache. Clients call the REST API through thin service modules and hold auth/location state in contexts.

## Runtime reachability
The target runtime boundary is the API route graph mounted from `app.ts`, plus the mobile/admin clients and shared API-facing types. `dist`, `node_modules`, `uploads`, and generated/build output are not source anchors.
