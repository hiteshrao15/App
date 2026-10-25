# t4 — BottleBazaar Target Architecture and Contracts

## Summary

BottleBazaar will cut over from the inline Express route implementation to a modular
Spring Boot API while preserving the `/api/v1` wire boundary for the Expo mobile and
administrative web clients. The target is a single deployable modular monolith for
the Sohna/Gurugram launch: explicit domain modules, PostgreSQL as the source of
truth, Redis for short-lived/rate-limit state, and an outbox-backed audit/event
boundary. Payments, delivery, online alcohol sales, and online redemption remain
impossible product actions.

## Upstream Artifacts Consumed

- `spec.md` — requirements, actors, critical journeys, entities, exclusions, and
  release success criteria.
- `architecture_index.md` — nine externally triggered units and implementation
  evidence expectations.
- `unit_graph.yaml` — unit dependencies and source-anchored public signatures.
- `wire_contracts.yaml` — frozen auth, discovery, redemption, and admin contracts.
- `migration_boundary.yaml` — phased `must_rewrite` scope and legacy rollback rule.
- `seams.yaml` — authoritative Spring cutover and PostgreSQL/Redis seam mappings.
- `shared_modules.yaml` — middleware and database/cache concerns to replace with
  explicit Spring ports.
- `cross_unit_state.yaml` — bearer, age-declaration, and Redis dynamic-key flows.
- `clarification.md` — Java/Spring target, Expo targets, accessibility, localization,
  and additive/reversible migration decisions.
- `constitution.md` — compliance-by-default, compatibility, and in-store-only rules.

## Evidence Mapping

- `spec.md#REQ-001..REQ-004` → Identity, eligibility, and public configuration
  modules and security filters in this document.
- `spec.md#REQ-009..REQ-014` → Offer policy, token issuance, and atomic redemption
  contracts below.
- `spec.md#REQ-019..REQ-024` → Governance, audit, analytics, and compatibility
  boundaries below.
- `wire_contracts.yaml#auth-request-otp/auth-verify-otp` → exact auth paths, generic
  responses, 600-second OTP expiry, and error status mapping.
- `wire_contracts.yaml#redemption-issue/redemption-validate` → 30-minute opaque
  token, hash-only persistence, store ownership, and atomic replay protection.
- `seams.yaml#services/api/src/app.ts:94` → frozen `/api/v1` client seam and explicit
  camelCase/status mapping.
- `cross_unit_state.yaml#redis-rate-limit` → runtime confirmation of dynamic Redis
  keys and 429 behavior.

## Target Runtime Shape

### Deployables and adapters

1. **`bottlebazaar-api` (Spring Boot, Java)** — the only target business API
   deployable. Spring MVC controllers expose `/api/v1`; application services own
   policies and transactions; repositories/adapters own PostgreSQL and Redis.
2. **PostgreSQL** — fresh, deterministic schema and launch seed data restricted to
   Sohna/Gurugram. Flyway migrations are additive and reversible until cutover.
3. **Redis** — OTP/rate-limit counters, cache entries, and short-lived idempotency
   state. Existing key prefixes and TTL semantics remain compatible during migration.
4. **Expo client** — one TypeScript client surface compiled for iOS, Android, and
   web. A typed API adapter keeps route names and response envelopes stable.
5. **Admin web** — React/Vite administrative and merchant surface using the same
   API contracts; customer-facing discovery remains available on Expo web.

There is intentionally no microservice split in the first cut. The domain modules
are package boundaries inside one deployable so redemption and compliance checks
share one transaction and can be split later behind the same ports.

### Layer rules

| Layer | Responsibility | Must not do |
|---|---|---|
| `interfaces.http` | Request parsing, DTO mapping, status/error translation, correlation ID | SQL, policy decisions, token generation |
| `application` | Use cases, authorization orchestration, transaction boundaries, event publication | Serialize HTTP or access Redis directly |
| `domain` | Offer/eligibility/redemption rules and state transitions | Know Spring, JDBC, or client UI |
| `ports` | Repository, clock, token, OTP, cache, notification, audit interfaces | Embed controller concerns |
| `adapters.persistence` | JPA/JDBC queries, row locks, Flyway integration, Redis mappings | Bypass application policies |
| `adapters.integration` | OTP delivery, notification, metrics, outbox publishing | Persist business state outside ports |

Recommended package roots:
`com.bottlebazaar.identity`, `eligibility`, `discovery`, `catalog`,
`offers`, `redemption`, `engagement`, `governance`, `analytics`, and
`platform` (security, errors, audit, persistence, cache, observability).

## Module Contracts and Ownership

| Module | Owns | Depends on | Transaction-sensitive rules |
|---|---|---|---|
| Identity | users, credentials, OTP challenges, sessions, roles | platform | Hash OTP/passwords; generic request-OTP response; revoke sessions on logout |
| Eligibility & config | age declarations, jurisdictions, dry days, public config | identity, governance | Server-side age, geography, maintenance, and dry-day decisions |
| Discovery | approved stores, licences, store detail | eligibility, catalog, offers | Publish only approved licensed in-scope stores |
| Catalog & inventory | categories, products, store inventory | discovery, governance | Store-owner scoping; prices remain integer paise |
| Offers | offer drafts, terms, review state, limits | discovery, catalog, governance | Claimability requires approved/licensed/active/in-scope state |
| Redemption | opaque token issue, validate, history | identity, eligibility, offers, discovery | `SELECT ... FOR UPDATE` (or equivalent) plus unique successful consumption |
| Engagement | favorites and notifications | identity, discovery, catalog | User-scoped reads/writes and read/read-all transitions |
| Governance | moderation, users, audit, config administration | all domain modules | Role matrix and attributable audit event for every mutation |
| Analytics | merchant/admin read models and trends | outbox/audit, all modules | Read-only projections; mask customer PII and scope merchant data |

Every module exposes application interfaces to its peers. Controllers never call a
repository from another module. Cross-module writes use an application command and
publish an outbox event after the domain transaction commits.

## HTTP Contract Rules

### Compatibility envelope

- Base path remains `/api/v1`; JSON properties remain camelCase.
- Existing `data` plus `pagination` list envelopes remain unchanged.
- Timestamps are ISO-8601 with timezone; money is integer `pricePaise`/`discountPaise`.
- Bearer sessions remain accepted. `401` means absent/invalid session; `403` means
  authenticated but disallowed/suspended/policy-blocked.
- Errors use a stable shape:
  `{code, message, correlationId, details?}`. `code` is machine-readable and
  distinguishes `AGE_REQUIRED`, `DRY_DAY`, `WRONG_STORE`, `ALREADY_REDEEMED`,
  `EXPIRED`, `LICENCE_INVALID`, `OUT_OF_SCOPE`, and `FORBIDDEN`.
- Unknown fields are ignored for additive compatibility; required fields are validated
  at the controller boundary. Never return OTPs, password hashes, raw token hashes,
  licence evidence, or unmasked customer identifiers.

### Endpoint groups

| Capability | Preserved/target endpoints | Auth | Target application operation |
|---|---|---|---|
| Auth | `POST /auth/request-otp`, `/auth/verify-otp`, `/auth/logout`; add `POST /auth/register`, `/auth/login`, `/auth/refresh` | request/verify public; rest bearer | `RequestOtp`, `VerifyOtp`, `PasswordLogin`, `RefreshSession`, `RevokeSession` |
| Profile | `GET/PATCH/DELETE /users/me`, `POST /users/me/declare-age` | bearer | `GetProfile`, `UpdateProfile`, `DeclareAge`, `DeleteAccount` |
| Public config | `GET /config/public`, `/config/jurisdictions` | public | `GetPublicConfig`; never expose private admin settings |
| Discovery | `GET /stores`, `/stores/{id}`, `/stores/{id}/products` | optional/bearer | `SearchStores`, `GetStore`, `ListStoreInventory` |
| Catalog/search | `GET /products`, `/products/{id}`, `/categories`, `/search`, `/search/suggestions` | optional/bearer | `SearchCatalog`, `GetProduct`, `Suggest` |
| Offers | `GET /offers`, `GET /offers/{id}`, merchant create/update/submit/mine | read optional; writes merchant/moderator | `SearchOffers`, `CreateOffer`, `SubmitOffer`, `ReviewOffer` |
| Redemption | `POST /redemptions/issue`, `/redemptions/validate`, `GET /redemptions/history` | customer issue; cashier/owner validate | `IssueVoucher`, `ValidateVoucher`, `ListRedemptions` |
| Engagement | favorites CRUD; notifications list/read/read-all | bearer | user-scoped commands/queries |
| Merchant operations | owned stores, licence metadata/evidence, inventory, analytics | merchant/cashier | ownership-scoped commands and projections |
| Governance | `/admin/dashboard`, stores, offers, users, audit, dry-days, config, analytics | moderator/admin | role-specific commands and read models |

The frozen contracts in `wire_contracts.yaml` override this grouping. New
email/password operations are additive and do not change OTP response fields.

### Authentication and authorization

Spring Security uses a stateless bearer access token backed by a persisted session
record, with refresh rotation and revocation. Passwords use Argon2id (or the
repository-approved Spring encoder); OTP values are hashed, expire in 600 seconds,
and lock after five failed attempts. Redis counters enforce phone/IP and redemption
rate limits. Method authorization is explicit (`CUSTOMER`, `CASHIER`,
`STORE_OWNER`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`) plus store-ownership checks.

## Critical Flow Design

### Claim

`IssueVoucher` loads the authenticated customer, age declaration, jurisdiction,
active dry-day/config policy, offer, store licence, inventory/limits, and current
time in one policy evaluation. It creates a cryptographically random opaque token,
stores only SHA-256(token), binds it to customer/offer/store, and returns the raw
token once with QR payload, fallback code, expiry, terms, and in-store-only
instructions. A failed policy check creates an audit event but no usable token.

### Validate/redeem

`ValidateVoucher` requires cashier/owner authorization and an owned approved store.
Within one PostgreSQL transaction it locks the token row, re-evaluates expiry,
status, store, age/geography, licence, dry-day, offer constraints, bill amount,
and limits; inserts one immutable redemption event; and transitions the token to
`REDEEMED`. A unique constraint on token consumption plus the row lock makes
concurrent requests return a deterministic `ALREADY_REDEEMED` outcome. Raw token
values never enter logs, audit payloads, or admin listings.

## Client and Experience Architecture

- Expo Router provides shared route semantics across iOS, Android, and web;
  screen modules consume typed hooks over the API adapter.
- Server state uses the existing compatible pattern where present; otherwise use a
  small query/cache layer with explicit loading, empty, offline, expired-session,
  unauthorized, and maintenance states.
- Design tokens centralize typography, spacing, contrast, focus rings, touch target
  sizes, and English/Hindi copy. QR wallet screens always provide a readable
  fallback code and store/expiry context.
- Admin and merchant routes are role-gated in the client for fast feedback, but all
  authorization and ownership enforcement remains server-side.
- No UI route or API action represents payment, delivery, online purchase, or online
  redemption.

## Migration and Rollback

1. Build Spring modules and Flyway schema beside the existing Express runtime.
2. Seed deterministic Sohna/Gurugram fixtures and run compatibility probes against
   both implementations.
3. Keep clients pointed at `/api/v1`; switch the API deployment target, not client
   payload shapes. Permit only base URL/config changes in frozen clients.
4. Observe auth, discovery, claim, redemption, dry-day, moderation, and audit
   probes; retain Express and old schema for rollback until all gates pass.
5. Remove legacy deployment only after mobile/admin smoke tests and concurrent
   redemption tests pass.

Rollback is a routing/deployment switch, not a data rewrite. Flyway migrations
must be backward-readable during the overlap window; incompatible schema changes
are prohibited until the old runtime is retired.

## Risks and Mitigations

| Severity | Risk | Mitigation |
|---|---|---|
| CRITICAL | Redemption race or replay creates a second discount | PostgreSQL row lock, unique consumption constraint, transaction test with concurrent requests |
| HIGH | Spring DTO/status drift breaks frozen clients | Explicit DTO mappers, contract snapshots, `/api/v1` probes, preserve `401`/`403` distinction |
| HIGH | Dry-day/licence checks only exist in UI | Central `EligibilityPolicy` called by browse, claim, and validate operations |
| HIGH | Dynamic Redis keys/TTLs drift | Named key builders, compatibility tests, runtime 429 probes |
| MEDIUM | Merchant analytics leaks customer PII | Projection-level masking and ownership predicates; audit access |
| MEDIUM | Legacy and fresh schemas diverge during rollback | Additive Flyway migrations, dual-read verification, no destructive migration before cutover |

## Architecture Decision Record

- **Modular monolith first:** preserves transaction integrity and lowers cutover
  coordination; ports keep later service extraction possible.
- **Explicit DTO mapping:** prevents Java naming/serialization defaults from silently
  changing existing camelCase contracts.
- **Policy as a reusable domain service:** makes age, geography, dry-day, licence,
  and maintenance enforcement consistent across all entry points.
- **Outbox audit/events:** keeps immutable audit evidence in the same transaction as
  business mutations while allowing analytics/read models to lag safely.

## Design Verification

- Nine existing units are represented by target modules and endpoint groups.
- Frozen contracts from `wire_contracts.yaml` are explicitly preserved.
- `migration_boundary.yaml` is respected: source anchors are evidence; only
  `must_rewrite` is implementation scope.
- No payments, delivery, online sale, or online redemption capability is introduced.
- The document is a design contract, not the full implementation contract; workers
  must read the per-unit behavior/bindings/decomposition files and global YAML
  artifacts listed in `architecture_index.md` before coding.

## Test Results

- Command: artifact self-check via `rg`/manual upstream cross-reference; no production
  code was changed, so project tests are not applicable to this documentation task.
- Passed: architecture contract checks listed above (9 unit mappings, frozen route
  preservation, compliance boundaries, and migration-scope rule).
- Failed: 0
- Skipped: runtime/build tests owned by implementation and tester roles.
