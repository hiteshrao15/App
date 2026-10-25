# t7 — BottleBazaar Implementation Plan and Task Breakdown

## Summary

This plan delivers the bounded BottleBazaar rewrite: a modular Java 21/Spring Boot
3.5 API over PostgreSQL 16 and Redis 7, compatible `/api/v1` contracts, a fresh
deterministic Sohna/Gurugram schema, and Expo iOS/Android/web plus admin surfaces.
Execution is vertical by business capability so each increment is independently
testable. Payments, delivery, online alcohol sale, and online redemption are
explicitly excluded.

## Upstream Artifacts Consumed

- `artifacts/spec.md` — REQ-001..REQ-024, NFR-001..NFR-005 and user journeys.
- `artifacts/constitution.md` — migration mode, target versions, boundaries and gates.
- `artifacts/t4-architect.md` — Spring module boundaries, ports, contracts and seams.
- `artifacts/t5-dba.md` — PostgreSQL model, migrations, indexes, seed and cutover.
- `artifacts/t6-ux.md` — customer/admin IA, states, accessibility and visual rules.
- `artifacts/t8-tester.md` — integration, runtime, browser, concurrency and fallback strategy.
- `clarification.md` — Expo/MUI targets, compatibility, localization and exclusions.
- `artifacts/wire_contracts.yaml`, `artifacts/unit_graph.yaml` — frozen routes and
  source anchors used in rewrite task annotations.

## Evidence Mapping

- `spec.md#REQ-001..REQ-004` → Plan 2.1, 3.1, 3.2; auth and eligibility tests.
- `spec.md#REQ-005..REQ-008` → Plan 4.1, 4.2; discovery/catalog client journeys.
- `spec.md#REQ-009..REQ-014` → Plan 5.1, 5.2, 5.3; claim and atomic redemption tests.
- `spec.md#REQ-015..REQ-018` → Plan 6.1, 6.2; merchant and engagement tests.
- `spec.md#REQ-019..REQ-022` → Plan 7.1, 7.2; governance and analytics tests.
- `spec.md#REQ-023..REQ-024`, `NFR-001..NFR-005` → Plan 2.2, 8.1, 8.2; contract,
  accessibility, performance, observability and release evidence.

## Technical Context

**Language/Version:** Java 21 (pin exact patch in CI), Spring Boot 3.5.x, Maven 3.9.x;
TypeScript/Expo existing workspace and React/Vite admin.
**Primary Dependencies:** Spring MVC/Security/Validation, Flyway, JDBC or JPA with
explicit locking, Redis client, Argon2id/bcrypt, OpenAPI; MUI for admin/web.
**Storage:** PostgreSQL 16; Redis 7 for OTP/rate limits/cache/idempotency; outbox,
audit and append-only analytics events.
**Testing:** Spring MockMvc and Testcontainers PostgreSQL/Redis, HTTP contract probes,
Playwright Expo-web/admin, axe and keyboard checks, concurrent redemption tests.
**Target Platform:** `services/api-java` Spring deployable; existing Expo mobile/web
and `apps/admin`, sharing typed API contracts. Legacy Express remains only behind a
documented feature-flag rollback seam until cutover.
**Performance Goals:** No regression from current baseline; ≥95% normal discovery and
wallet actions within two seconds under baseline conditions.
**Constraints:** Only Sohna/Gurugram; server-side age/licence/dry-day enforcement;
camelCase envelopes, integer paise, ISO timestamps, 401/403 distinction; no secrets,
payments, delivery, or online redemption.

## Constitution Check

- **I Contract-first compatibility — PASS:** frozen `/api/v1` routes, envelopes,
  source anchors and adapters are explicit in Plan 2.2 and every vertical slice.
- **II Domain/boundary integrity — PASS:** identity, eligibility, discovery/catalog,
  offers, redemption, engagement, governance and analytics are separate modules;
  policies are not placed in controllers.
- **III Security/compliance/privacy — PASS:** hashed OTP/password/token values,
  rate limits, role/ownership checks, audit masking, age/licence/dry-day enforcement
  and row-locked single-use redemption are acceptance criteria.
- **IV Behavioral/accessibility verification — PASS:** Plan 8 includes full build,
  runtime probes, contract tests, critical journeys, concurrency, Playwright and axe.
- **V Observable/reversible delivery — PASS:** Flyway sequence, outbox/audit,
  correlation IDs, health/readiness, metrics, feature-flag rollback and cutover
  evidence are foundational tasks.

## Applied Guidelines

- Spring MVC layered migration pattern: controllers map DTOs, application services
  own transactions, domain services own rules, ports isolate persistence/integrations.
- Compatibility-adapter pattern: preserve `/api/v1`, camelCase and status/error
  semantics; add new email/password routes without changing frozen OTP behavior.
- Transactional voucher pattern: hash opaque tokens, lock by token row, enforce store
  ownership and unique successful consumption in one transaction.
- Additive database migration pattern: create fresh V001–V006 schema and seed,
  stage legacy imports, quarantine unsupported geography, and retain rollback seam.
- Expo accessibility pattern: semantic labels, focus order, loading/error/empty
  states, bilingual compliance copy, and no ecommerce affordances.

## Implementation Steps and Embedded Tasks

### Phase 1 — Setup

#### Plan 1.1: Establish target build and runtime seams (REQ-023, NFR-004, NFR-005)

- [ ] T001 [Plan:1.1] Create `services/api-java/pom.xml`, Maven wrapper, Java 21
  toolchain and Spring Boot 3.5.x dependency management; document commands in
  `services/api-java/README.md`.
- [ ] T002 [P] [Plan:1.1] Add `services/api-java/src/main/java/com/bottlebazaar/platform`
  package skeleton, profiles, health/readiness endpoints and correlation-ID filter.
- [ ] T003 [P] [Plan:1.1] Add Java service environment templates and secret/config
  binding in `services/api-java/src/main/resources/application.yml` and
  `application-test.yml`; never commit credentials.
- [ ] T004 [P] [Plan:1.1] Add CI jobs in `.github/workflows/ci.yml` for Java 21,
  Maven verify, existing client builds, lint and artifact retention.

#### Plan 1.2: Freeze compatibility and migration seams (REQ-023, NFR-004)

- [ ] T005 [Plan:1.2] Encode frozen route/status/envelope DTO contracts under
  `services/api-java/src/main/java/com/bottlebazaar/platform/http` from
  `artifacts/wire_contracts.yaml`.
- [ ] T006 [P] [Plan:1.2] Add legacy API feature flag, routing/rollback documentation
  in `infra/migration/README.md` and a compatibility contract test fixture.
- [ ] T007 [P] [Plan:1.2] Define typed shared client interfaces in
  `packages/api-client/src` for `/api/v1`, preserving existing route and tab IDs.

### Phase 2 — Foundational

#### Plan 2.1: Create schema, seed and persistence ports (REQ-003, REQ-021, NFR-004)

- [ ] T008 [Plan:2.1] Create Flyway `V001__fresh_core.sql` through
  `V006__launch_seed.sql` under `services/api-java/src/main/resources/db/migration`
  for UUID entities, auth, catalogue, stores, offers, tokens, audit, events and
  Sohna/Gurugram deterministic seed data.
- [ ] T009 [P] [Plan:2.1] Implement persistence port interfaces and transaction
  configuration in `platform/persistence`; use UTC instants, integer paise and
  explicit foreign-key delete behavior.
- [ ] T010 [P] [Plan:2.1] Implement PostgreSQL repositories/adapters for core tables
  in `adapters/persistence/postgres`; add partial/search indexes and row-lock queries.
- [ ] T011 [Plan:2.1] Add staging import, stable-ID mapping, unsupported-geography
  quarantine and rollback runbook under `infra/migration/`.

#### Plan 2.2: Establish security, errors, audit and observability (REQ-001, REQ-021,
  REQ-023, NFR-003, NFR-005)

- [ ] T012 [Plan:2.2] Implement Spring Security bearer/session filter, role matrix,
  401/403 mapping and ownership authorization in
  `platform/security/SecurityConfig.java`.
- [ ] T013 [P] [Plan:2.2] Implement stable error envelope, validation mapping and
  correlation IDs in `platform/http/ApiExceptionHandler.java`.
- [ ] T014 [P] [Plan:2.2] Implement append-only audit/outbox ports and masked
  structured logging in `platform/audit` and `platform/observability`.
- [ ] T015 [P] [Plan:2.2] Implement Redis adapter for dynamic rate-limit, OTP/cache
  and idempotency keys with existing TTL semantics in `platform/cache`.

### Phase 3 — P1 Customer identity and legal access

#### Plan 3.1: Implement identity and session vertical slice (REQ-001, REQ-018, REQ-021)

- [ ] T016 [US1] [Plan:3.1] Convert OTP request/verify/logout behavior into
  `identity/application/AuthService.java` and repositories, hashing OTPs, enforcing
  five-attempt lockout, 600-second expiry and generic responses
  [Source: services/api/src/routes/auth.ts#requestOtp,verifyOtp,logout].
- [ ] T017 [US1] [P] [Plan:3.1] Add email/password register/login/refresh/revoke with
  Argon2id/bcrypt credentials and safe validation in
  `identity/application/PasswordAuthService.java`.
- [ ] T018 [US1] [Plan:3.1] Expose compatible auth controllers and DTOs in
  `identity/interfaces/http/AuthController.java`
  [Source: services/api/src/routes/auth.ts#requestOtp,verifyOtp,logout].
- [ ] T019 [US1] [P] [Plan:3.1] Update `apps/mobile` and `apps/admin` auth screens,
  session storage and error states using typed client methods; preserve OTP flow.
- [ ] T020 [US1] [Plan:3.1] Add MockMvc/Testcontainers auth tests for signup/login,
  OTP replay/expiry/rate limit, logout/refresh, suspension and secret non-disclosure.

#### Plan 3.2: Implement eligibility and public configuration (REQ-002, REQ-003,
  REQ-004, REQ-021)

- [ ] T021 [US2] [Plan:3.2] Implement `eligibility` age declaration, jurisdiction,
  maintenance, statutory warning and policy-version services with immutable audit
  evidence [Source: services/api/src/routes/users.ts#declareAge].
- [ ] T022 [US2] [P] [Plan:3.2] Implement dry-day and local Asia/Kolkata date policy
  adapter against `dry_days` and public config repository.
- [ ] T023 [US2] [Plan:3.2] Expose `/users/me/declare-age`, `/config/public` and
  `/config/jurisdictions` in `EligibilityController.java`, rejecting unsupported
  city and missing/under-age declarations at service boundaries.
- [ ] T024 [US2] [Plan:3.2] Implement onboarding city/age gate and profile consent
  screens in Expo with bilingual warnings, recoverable blocked states and deep-link
  preservation.
- [ ] T025 [US2] [Plan:3.2] Add negative tests for client-tampered geography, missing
  age, under-age, maintenance and dry-day policy responses.

### Phase 4 — P1 discovery and catalogue

#### Plan 4.1: Implement stores, licences, catalogue and inventory (REQ-005, REQ-006,
  REQ-008, REQ-015, REQ-016, REQ-021)

- [ ] T026 [US3] [Plan:4.1] Convert store list/detail/products and ownership behavior
  into discovery application services/controllers
  [Source: services/api/src/routes/stores.ts#listStores,getStore,getStoreProducts].
- [ ] T027 [US3] [P] [Plan:4.1] Implement catalogue/category/product read and
  merchant store-product inventory commands with paise/stock validation
  [Source: services/api/src/routes/products.ts#listProducts,getProduct]
  [Source: services/api/src/routes/categories.ts#listCategories].
- [ ] T028 [US3] [P] [Plan:4.1] Implement licence submission/status/evidence metadata,
  publication filtering and merchant ownership checks in `discovery` module.
- [ ] T029 [US3] [Plan:4.1] Add `/stores`, `/stores/{id}`, `/stores/{id}/products`,
  `/products`, `/categories` and merchant inventory endpoints with pagination metadata.
- [ ] T030 [US3] [Plan:4.1] Build Expo Home, Discover, store detail, product detail,
  merchant store/inventory screens with skeleton, empty, offline and accessibility
  states.
- [ ] T031 [US3] [Plan:4.1] Add API integration tests proving only approved,
  licensed, in-scope stores/products and owned inventory mutations are visible.

#### Plan 4.2: Implement search, favorites and notifications (REQ-005, REQ-007,
  REQ-018, NFR-001)

- [ ] T032 [US3] [P] [Plan:4.2] Implement PostgreSQL search/suggestions and filtered
  pagination in `search-config` service [Source: services/api/src/routes/search.ts#search,suggestions].
- [ ] T033 [US3] [P] [Plan:4.2] Convert favorites and notification read/read-all
  endpoints with user scoping [Source: services/api/src/routes/favorites.ts]
  [Source: services/api/src/routes/notifications.ts].
- [ ] T034 [US3] [Plan:4.2] Add Discover filters, favorites, notifications and
  accessible retry/empty states to Expo and typed client.
- [ ] T035 [US3] [Plan:4.2] Add search relevance/filter, favorite authorization and
  notification persistence/read-state contract tests.

### Phase 5 — P1 offers, claims and redemption

#### Plan 5.1: Implement moderated offers and claim eligibility (REQ-009, REQ-010,
  REQ-011, REQ-013, REQ-021)

- [ ] T036 [US4] [Plan:5.1] Convert offer list/create/update/submit behavior into
  offer domain/application services with percentage/fixed/custom terms, limits,
  dates and ownership validation [Source: services/api/src/routes/offers.ts#createOffer,listOffers,submitOffer].
- [ ] T037 [US4] [Plan:5.1] Implement offer review lifecycle and reasoned status
  transitions through governance ports, auditing every moderation decision.
- [ ] T038 [US4] [Plan:5.1] Expose compatible `/offers` and merchant offer endpoints
  with eligibility reason codes and approved/licensed/in-scope filtering.
- [ ] T039 [US4] [Plan:5.1] Build customer Offers/Offer detail/claim confirmation and
  merchant offer editor screens; never expose payment/delivery actions.
- [ ] T040 [US4] [Plan:5.1] Add tests for invalid terms, limits, expired/unapproved/
  unlicensed/dry-day offers, duplicate claims and safe error responses.

#### Plan 5.2: Implement opaque single-use vouchers and wallet (REQ-011, REQ-013,
  REQ-014, NFR-003)

- [ ] T041 [US4] [Plan:5.2] Implement hashed opaque token issuance, 30-minute/configured
  expiry, store/offer/customer binding and idempotency in `redemption` application
  services [Source: services/api/src/routes/redemptions.ts#issue].
- [ ] T042 [US4] [Plan:5.2] Expose issue/history endpoints and return raw token only
  once; ensure logs, admin views and notifications contain no secrets.
- [ ] T043 [US4] [Plan:5.2] Build Wallet list/detail and counter-ready QR/fallback
  presentation with active/redeemed/expired/cancelled states and no redeem control.
- [ ] T044 [US4] [Plan:5.2] Add issuance, expiry, duplicate, cancellation and
  non-disclosure tests plus contract snapshots.

#### Plan 5.3: Implement atomic in-store redemption (REQ-012, REQ-013, REQ-014,
  REQ-017, REQ-021)

- [ ] T045 [US4] [Plan:5.3] Convert validation into a transactionally row-locked
  redemption service that checks token, store, licence, age, geography, dry day,
  bill and authorization [Source: services/api/src/routes/redemptions.ts#validate].
- [ ] T046 [US4] [Plan:5.3] Persist immutable redemption events, discount/bill values,
  audit outcomes and distinct invalid/expired/redeemed/wrong-store/dry-day errors.
- [ ] T047 [US4] [Plan:5.3] Expose cashier scan/code validation and redemption-history
  endpoints; mask customer data and scope merchant stores.
- [ ] T048 [US4] [Plan:5.3] Build merchant cashier redemption UI with QR/code input,
  bill validation, confirmation and explicit reason states.
- [ ] T049 [US4] [Plan:5.3] Add Testcontainers concurrency test with two simultaneous
  attempts asserting exactly one success and replay rejection.

### Phase 6 — P2 merchant operations and engagement

#### Plan 6.1: Complete merchant workspace (REQ-015, REQ-016, REQ-017, REQ-018)

- [ ] T050 [US5] [Plan:6.1] Add merchant store/licence edit, inventory movement and
  offer workflow endpoints with audit and ownership enforcement.
- [ ] T051 [US5] [P] [Plan:6.1] Add merchant overview, store wizard, inventory table,
  offer management, redemption history and analytics views in `apps/admin`.
- [ ] T052 [US5] [Plan:6.1] Add merchant data-masking, cross-store authorization,
  inventory audit and notification integration tests.

#### Plan 6.2: Complete customer profile and preferences (REQ-007, REQ-018)

- [ ] T053 [US6] [Plan:6.2] Implement profile update/delete/logout, locale and
  notification-preference commands in `user-profile` and engagement modules
  [Source: services/api/src/routes/users.ts].
- [ ] T054 [US6] [Plan:6.2] Build Account, language, favorites and notification
  preference screens with deletion/logout confirmations and accessible feedback.
- [ ] T055 [US6] [Plan:6.2] Add persistence/authorization tests for profile,
  favorites, preferences, deletion and session revocation.

### Phase 7 — P1 governance and P2 analytics

#### Plan 7.1: Implement moderation, user/config administration and audit (REQ-019,
  REQ-020, REQ-021)

- [ ] T056 [US7] [Plan:7.1] Convert admin moderation, users, config and audit routes
  into role-separated governance controllers/services
  [Source: services/api/src/routes/admin.ts#dashboard,moderateStore,moderateOffer,updateConfig].
- [ ] T057 [US7] [Plan:7.1] Implement dry-day calendar, age/legal/token settings,
  maintenance controls and attributable configuration audit records.
- [ ] T058 [US7] [Plan:7.1] Build moderator/admin workspace screens with hidden
  unauthorized navigation, safe 403/404 pages, review notes and masked PII.
- [ ] T059 [US7] [Plan:7.1] Add governance tests for role matrix, approval/rejection/
  suspension, user status changes, dry-day enforcement and audit completeness.

#### Plan 7.2: Implement merchant/admin analytics (REQ-017, REQ-022, NFR-001, NFR-005)

- [ ] T060 [US7] [Plan:7.2] Implement outbox consumer/analytics projection and scoped
  merchant/admin aggregate queries for counts, trends, backlogs and failures.
- [ ] T061 [US7] [Plan:7.2] Expose date/geography/store-filtered analytics endpoints
  with least-privilege read models and no raw customer PII.
- [ ] T062 [US7] [Plan:7.2] Build merchant and admin dashboards with loading,
  no-data, error, date-filter and export-safe states.
- [ ] T063 [US7] [Plan:7.2] Add analytics authorization, event projection,
  reconciliation and performance query tests.

### Phase 8 — Cross-cutting polish, compatibility and release gates

#### Plan 8.1: Finish visual, accessibility, localization and performance quality
 (REQ-004, REQ-005, REQ-006, REQ-008, REQ-014, NFR-001, NFR-002, NFR-003)

- [ ] T064 [P] [Plan:8.1] Consolidate premium design tokens, responsive breakpoints,
  typography and MUI/Expo shared patterns in `packages/ui` and `apps/admin`.
- [ ] T065 [P] [Plan:8.1] Audit all customer/admin screens for English/Hindi parity,
  focus order, labels, contrast, touch targets and loading/error/empty/offline states.
- [ ] T066 [Plan:8.1] Add performance instrumentation and verify discovery/wallet
  p95 against baseline; document any measured regression and remediation.
- [ ] T067 [Plan:8.1] Remove or block executable payment, delivery, checkout and
  online-redemption affordances from clients and API route registry.

#### Plan 8.2: Execute full verification and cutover (REQ-023, REQ-024, NFR-004,
 NFR-005)

- [ ] T068 [Plan:8.2] Add frozen `/api/v1` contract tests and compatibility adapters
  for auth, discovery, offers, redemption, engagement and admin routes.
- [ ] T069 [Plan:8.2] Add Playwright Expo-web/admin journeys for auth, age/city,
  discovery, claim, Wallet, cashier redemption, moderation and dry-day blocking.
- [ ] T070 [Plan:8.2] Add axe/keyboard accessibility checks and browser matrix evidence
  for login, discovery, Wallet, redemption and admin moderation.
- [ ] T071 [Plan:8.2] Run `mvn -B clean verify`, client frozen install/build/test,
  Testcontainers integration suite, runtime `/health`/auth/discovery/redemption
  probes and capture commands/results in release evidence.
- [ ] T072 [Plan:8.2] Execute staged migration/cutover rehearsal, verify rollback
  feature flag, seed determinism, health/metrics/audit evidence and obtain binary
  PASS sign-off before disabling legacy Express.

## Project Structure

```text
services/api-java/
  pom.xml
  src/main/java/com/bottlebazaar/{identity,eligibility,discovery,catalog,offers,
    redemption,engagement,governance,analytics,platform}/
  src/main/resources/{application*.yml,db/migration/V001..V006}
apps/mobile/                 # Expo iOS/Android/web customer experience
apps/admin/                  # React/Vite MUI merchant/moderator/admin workspace
packages/api-client/         # typed compatible REST adapter
packages/ui/                 # shared tokens/accessibility primitives
infra/migration/             # staging, cutover, rollback and evidence runbooks
.github/workflows/ci.yml
```

## Testing Strategy

- **appType:** mixed Spring REST API + Expo iOS/Android/web + React/Vite admin.
- **Critical journeys:** identity/session safety; age/geography/public config;
  discovery-to-claim; atomic cashier redemption/replay; merchant moderation,
  dry-day and analytics.
- **primaryValidationStack:** Spring MockMvc, Testcontainers PostgreSQL/Redis,
  packaged-service HTTP probes, Playwright and axe.
- **fallbackMatrix:** `infra-tier` Docker/Testcontainers → H2/local Redis only after
  recorded `docker info` failure; `browser-tier` Playwright Chromium → API/MockMvc
  only after reproducible Node/browser installation failure; native mobile uses Expo
  web fallback if simulator unavailable. Each fallback records fidelity loss.
- **Environment requirements:** Java 21, Maven 3.9, Node 20+/npm 10+, Docker,
  PostgreSQL/Redis containers, Playwright Chromium, Expo tooling.
- **Test data strategy:** deterministic V006 seed, isolated database/schema per run,
  generated identities/tokens, stub SMS/email/maps/object storage, teardown uploads.
- **Acceptance criteria:** all P1 journeys happy/error/persistence/cleanup assertions;
  server rejects policy bypasses; exactly one concurrent redemption; no secret/PII
  leakage; no forbidden actions; compatible contracts and WCAG checks pass.
- **Validation review expectations:** tester reports command, return code, pass/fail/
  skipped counts and runtime evidence; architect separately verifies full build and
  startup probes; any HIGH/CRITICAL finding is a binary FAIL.

## Requirement Mapping

| REQ ID | Description | Plan Items | Implementation Evidence |
|---|---|---|---|
| REQ-001 | OTP and email/password auth | 2.2, 3.1 | AuthService, PasswordAuthService, auth tests |
| REQ-002 | Configurable age declaration | 3.2 | EligibilityService, declare-age tests |
| REQ-003 | Sohna/Gurugram enforcement | 2.1, 3.2, 4.1, 5.3 | jurisdiction policy and negative tests |
| REQ-004 | Public compliance config | 3.2, 8.1 | config controllers, bilingual warnings |
| REQ-005 | Search/filter/pagination | 4.1, 4.2 | search service, Discover E2E |
| REQ-006 | Store detail/licence/catalogue | 4.1 | StoreController, licence tests |
| REQ-007 | Favorites | 4.2, 6.2 | engagement APIs, Favorites UI |
| REQ-008 | Product/category detail | 4.1 | CatalogController, product UI |
| REQ-009 | Offer authoring | 5.1 | OfferService/editor/tests |
| REQ-010 | Claimability policy | 3.2, 5.1 | eligibility and offer policy tests |
| REQ-011 | Opaque single-use voucher | 5.2 | token hash/Wallet tests |
| REQ-012 | Atomic redemption checks | 5.3 | row-lock service/concurrency test |
| REQ-013 | Distinct redemption outcomes | 5.3 | error codes/contract tests |
| REQ-014 | No payments/delivery/online redemption | 5.2, 8.1 | forbidden-route/UI scan |
| REQ-015 | Merchant store/licence | 4.1, 6.1 | merchant endpoints/wizard |
| REQ-016 | Inventory management | 4.1, 6.1 | inventory adapters/UI/tests |
| REQ-017 | Merchant history/analytics | 5.3, 7.2 | scoped reports/masked history |
| REQ-018 | Notifications | 4.2, 6.2 | notification APIs/preferences UI |
| REQ-019 | Moderation | 5.1, 7.1 | governance controllers/moderation E2E |
| REQ-020 | Admin users/config/dry days | 3.2, 7.1 | config/calendar/user tests |
| REQ-021 | Audit evidence | 2.2, 3.2, 5.3, 7.1 | audit/outbox assertions |
| REQ-022 | Admin analytics | 7.2 | projections/dashboard tests |
| REQ-023 | Compatible routes/behavior | 1.2, 2.2, 8.2 | frozen contract suite/cutover |
| REQ-024 | Critical runtime evidence | 8.1, 8.2 | Playwright, probes, release report |

## Non-Functional Traceability

- NFR-001: Plans 4.2, 7.2, 8.1 — baseline/performance evidence.
- NFR-002: Plans 3.2, 4.1, 5.2, 7.1, 8.1/8.2 — WCAG/browser evidence.
- NFR-003: Plans 2.2, 5.2, 5.3, 7.1 — security, masking and secret tests.
- NFR-004: Plans 1.1, 1.2, 2.1, 8.2 — additive migrations and rollback rehearsal.
- NFR-005: Plans 1.1, 2.2, 7.2, 8.2 — health, correlation, metrics and release probes.

## Warnings

- `artifacts/project-profile.yaml` reports `grouping_needed: false`; no G-group tags
  are used.
- Exact response schemas for newly added email/password and analytics endpoints must
  be finalized in implementation without changing frozen contracts.
- Native iOS/Android simulator evidence is environment-dependent; Expo web remains
  mandatory and any native gap must be explicitly recorded.

