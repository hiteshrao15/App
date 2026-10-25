# Existing BottleBazaar Data Model

## Entities and relationships
- `jurisdictions` (state/country, minimum age) has many `cities`, `stores`; `cities` has many `pin_codes`.
- `users` has OTPs, sessions, consents, stores (owner), offers (creator/reviewer), redemptions, favorites, notifications and audit rows.
- `categories` and `brands` classify `products`; `products` have many `store_products`, offers and favorites.
- `stores` belong to an owner and jurisdiction/city; stores have catalog rows, offers and redemption tokens.
- `offers` belong to store, optionally product, and creator; counters and approval/review state are persisted.
- `redemption_tokens` reference offer, customer user, store and cashier user; status transitions issued→redeemed/expired/cancelled.
- `app_config` stores JSONB key/value configuration; `audit_logs` records actor/action/target metadata.

## Field inventory (schema source)
Authoritative fields, enum values, indexes and constraints are in `services/api/src/db/migrations/001_initial_schema.sql:12-410`. Important contracts include UUID primary keys, `users.phone` uniqueness, PostgreSQL enum statuses, JSONB opening hours/config, paise integer prices, valid offer date/discount checks, and token hash uniqueness.

## Transaction boundaries
OTP user upsert is wrapped by `withTransaction` in `routes/auth.ts:190-201`. Redemption issuance locks the offer row, checks limits, inserts the token and increments the counter in one transaction (`routes/redemptions.ts:74-119`). Redemption validation locks the token, checks store/status/expiry, and marks it redeemed atomically (`routes/redemptions.ts:157-204`).

## Key entities
1. User/auth/session — phone identity, role/status, age declaration and bearer sessions.
2. Jurisdiction/city — legal minimum-age and locality scope.
3. Store/store_products — licensed retailer, location, hours, inventory and price.
4. Product/category/brand — discoverable catalogue.
5. Offer — moderated, time-bounded discount with redemption limits.
6. Redemption token — hashed, single-use in-store voucher.
7. App config — operational/compliance feature flags and messages.
8. Audit log/notification — immutable governance evidence and user messaging.
