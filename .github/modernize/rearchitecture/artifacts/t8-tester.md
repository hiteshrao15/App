# t8 — BottleBazaar End-to-End Testing and Validation Strategy

## Summary

BottleBazaar is a mixed application: a Spring Boot REST API plus Expo
iOS/Android/web clients and a React/Vite admin surface. The release gate is
contract-first runtime evidence, not a successful compile. The primary stack is
real PostgreSQL/Redis infrastructure, Spring integration tests, and Playwright
browser tests against the running web client. Mobile-specific smoke tests run
through Expo web and platform test harnesses where available.

## Upstream Artifacts Consumed

- `artifacts/architecture_index.md` — API units, required health/auth/discovery/redemption probes, and runtime-confirmation boundaries.
- `artifacts/spec.md` — P1/P2 journeys and REQ-001 through REQ-024 acceptance scope.
- `artifacts/constitution.md` — Java/Spring target, API compatibility, compliance, privacy, and release-gate principles.
- `team/tester/inbox.md` — explicit requirement to prove REQ-002/003, REQ-011–013, and REQ-023.
- `artifacts/clarification.md` — not present in the supplied artifact directory.

## Evidence Mapping

- `spec.md#User Scenarios & Testing` P1 authentication, eligibility, discovery,
  claim, redemption, merchant onboarding, moderation, and analytics journeys →
  critical journeys and acceptance criteria below.
- `spec.md#REQ-002–REQ-003` age and Sohna/Gurugram enforcement → Journey 2,
  negative geography/age cases, and server-side bypass assertions.
- `spec.md#REQ-010–REQ-014` offer eligibility, token lifecycle, atomic
  redemption, distinct errors, and excluded payments → Journeys 3–4.
- `constitution.md#Core Principles I–IV` compatibility, domain boundaries,
  privacy, single-use QR, dry-day enforcement, and runtime gates → contract,
  concurrency, audit, and forbidden-action checks.
- `architecture_index.md#Required verification` → health, auth, discovery, and
  redemption endpoint probes in the startup/contract suite.

## Testing Strategy

### App type and validation stack

- `appType`: mixed (Spring Boot REST API + Expo client + React/Vite admin).
- API integration: `@SpringBootTest` + `@AutoConfigureMockMvc` for controller,
  security, exception, and contract assertions; Testcontainers PostgreSQL and
  Redis for real persistence/cache semantics.
- API runtime: start the packaged Spring service and execute HTTP contract tests
  against `/health` (or the configured readiness endpoint) and `/api/v1`.
- Browser E2E: Playwright TypeScript against Expo web and the Vite admin build.
  Prefer accessible roles/labels and stable `data-testid` only where no semantic
  locator exists.
- Mobile smoke: Expo web flow is mandatory in CI; iOS/Android device or
  simulator smoke is run when the corresponding platform toolchain is available.
  The same API contract fixture and seeded identities must be used across
  platforms.
- Accessibility: Playwright keyboard traversal plus axe-based WCAG 2.1 AA checks
  for login, discovery, wallet, redemption, and admin moderation pages.

### Critical user journeys

1. **Authentication and session safety (REQ-001)** — email/password signup/login,
   phone OTP request/verify, invalid credential and expired/replayed OTP errors,
   refresh/revocation, logout, and confirmation that secrets never appear in
   response bodies or logs.
2. **Legal access and launch geography (REQ-002/003/004)** — authenticated user
   must declare configured age for a policy version before discovery; verify
   timestamp/jurisdiction persistence; reject under-age, missing-age, and
   unsupported-location requests even when the client tampers with location.
3. **Discovery to claim (REQ-005/006/008/010/011)** — approved licensed Sohna or
   Gurugram store and active offer are searchable; unapproved/expired/out-of-scope
   records are absent; claim produces an opaque 30-minute-or-configured QR and
   fallback code tied to customer/store/offer and visible in Wallet.
4. **Merchant redemption lifecycle (REQ-012/013/017)** — authorized cashier
   redeems a valid token for the correct store and bill; assert immutable
   redemption, exact discount, audit event, and masked merchant history. Exercise
   wrong store, invalid bill, expired, cancelled, unauthorized, and already
   redeemed outcomes. Run two concurrent redemption attempts and assert exactly
   one success.
5. **Compliance and operations (REQ-015/016/019/020/021/022/023/024)** —
   merchant submits store/license and catalogue changes; moderator approves or
   rejects with a reason; admin configures a dry day and policy; claim/redemption
   is blocked on that day; audit and analytics show attributable outcomes; legacy
   compatible routes and response shapes remain green.

### Acceptance criteria

- Every P1 journey has at least one happy path, authentication/authorization
  failure, persistence read-back, and cleanup assertion.
- Age, geography, licence, dry-day, offer state, bill constraints, and ownership
  are rejected at the API boundary, not just hidden by UI.
- Concurrent redemption has one and only one committed success; all retries
  return a documented distinct replay outcome and never create a second record.
- Token values/secrets, passwords, OTPs, and private licence evidence are absent
  from logs, admin listings, and merchant responses.
- Payments, delivery, online alcohol sale, and online redemption have no
  executable UI action or API route.
- Compatible `/api/v1` routes are tested against frozen request/response/error
  contracts, with any adaptation explicitly versioned and documented.
- Browser journeys meet WCAG 2.1 AA checks and have meaningful loading, empty,
  error, expiry, and recovery states.

## Capability and fallback matrix

The infrastructure and browser axes are independent. A failure on one never
justifies skipping the other.

| Axis | Primary (must attempt) | Fallback only after reproducible failure | Gap to record |
|---|---|---|---|
| `infra-tier` | Docker daemon + Testcontainers PostgreSQL and Redis | H2/PostgreSQL-compatible embedded database and local Redis substitute/mock only if Docker is unavailable | SQL/type/locking/cache fidelity loss; H2 risks include JSONB, UUID/array types, PostgreSQL upsert/RETURNING, extensions, and index semantics |
| `browser-tier` | Node.js + `npx playwright install --with-deps chromium`, Playwright against Expo web/admin | Spring MockMvc/API HTTP tests if Node or browser installation is unavailable | No browser rendering, asset, keyboard, screen-reader, or client-routing proof |
| mobile platform | Expo web plus iOS/Android simulator/device when toolchain exists | Expo web only, with platform gap explicitly marked | Native permission/layout/gesture differences unverified |

Before selecting a fallback, record exact commands and output:
`docker info`, `node --version`, `npm --version`, `mvn --version`, and
`npx playwright install --with-deps chromium`. Escalate each unavailable primary
capability independently to the coordinator.

## Environment and dependency requirements

- Java 17+ (target Spring Boot 3.5.x), Maven wrapper or `mvn`; Node.js >=20,
  npm >=10; Docker daemon functional for PostgreSQL and Redis.
- Testcontainers uses an isolated PostgreSQL database and Redis namespace per
  test run. No shared developer database is permitted.
- External SMS/OTP provider, email sender, analytics exporter, maps/directions,
  and object storage are stubbed through injectable interfaces or a local mock
  server; tests assert request shape without sending real messages.
- File uploads use a temporary test directory and are deleted in teardown.
- Frontend API calls use the running test API, not mocked responses, for E2E.
  API contract fixtures may mock only unavailable third-party boundaries.
- Spring security uses deterministic test identities/tokens generated by test
  helpers; secrets are injected through environment variables and never checked
  into fixtures.

## Test data, isolation, and cleanup

- Seed deterministic baseline jurisdictions (Sohna and Gurugram), policy, warning,
  one approved licensed store per jurisdiction, one pending/rejected store,
  products, inventory, approved/draft/expired offers, and dry-day fixtures.
- Every test-created user/store/offer uses a UUID suffix. Do not rely on seed
  row IDs or execution ordering.
- Use transaction rollback for isolated service tests; API/E2E setup calls create
  records and teardown deletes by run UUID. Keep audit records until assertions
  complete, then clean the run namespace.
- Freeze time through an injectable clock for expiry/dry-day cases; use a
  separate real-time test for token TTL boundary.
- Parallel tests must use separate users and stores. Concurrency tests share only
  the intentionally contended voucher.

## Test infrastructure and runnable skeleton

The implementation plan must create these test assets before feature work:

- `services/api/src/test/java/.../BaseIntegrationTest.java`: container lifecycle,
  dynamic Spring properties, UUID run namespace, clock, seed helpers, auth
  helpers, and cleanup.
- API module skeletons for `AuthContractIT`, `EligibilityContractIT`,
  `DiscoveryOfferContractIT`, `RedemptionConcurrencyIT`, and
  `AdminGovernanceContractIT`; each includes startup/readiness and at least one
  persistence read-back assertion.
- `e2e/playwright.config.ts`, `e2e/auth.spec.ts`, `e2e/discovery-wallet.spec.ts`,
  `e2e/merchant-redemption.spec.ts`, `e2e/admin-compliance.spec.ts`, and
  accessibility helpers. Each spec is a multi-step setup → action → verify →
  cleanup flow.
- Root canonical test command must run API integration/contract tests and
  Playwright (for example, `npm test` orchestrating Maven plus E2E, or the
  repository's selected equivalent). Every implementation task runs its module
  tests and reports pass/fail/skip counts; failures block completion.

### External dependency strategy

| Dependency | Test mode |
|---|---|
| PostgreSQL | Real Testcontainers instance; migrations and locks exercised |
| Redis | Real Testcontainers instance; rate limits, token state, and cache semantics exercised |
| SMS/email | Stub provider/local mock; capture request without OTP leakage |
| Object storage/files | Temporary local filesystem; cleanup verified |
| Maps/directions | Contract stub returning deterministic links |
| API ↔ Expo/admin | Real HTTP API in E2E; typed DTO/route contract tests in API module |
| Metrics/log sink | In-memory capture appender; assert correlation IDs and secret redaction |

## Legacy test assets

- `legacyTestAssets`: discovered `services/api/src/__tests__/auth.test.ts` and
  `services/api/src/__tests__/redemptions.test.ts`; no browser E2E suite was
  found in `apps/`.
- `migrationDecision`: reuse-with-edits for semantic API coverage, then port to
  Spring integration tests where implementation details are Express-specific.
  Preserve journey intent and error distinctions; do not translate line by line.
- New Playwright specs are required because no legacy browser suite was found.

## Validation review expectations

The final reviewer must verify the exact environment commands and exit codes,
startup readiness evidence, test counts, per-capability fallback rationale,
critical journey-to-test mapping, contract compatibility evidence, concurrency
proof, audit/log redaction evidence, and accessibility results. Any unverified
critical flow is explicitly `NEEDS_SIGNOFF`, not silently treated as pass.

## Artifact status

This is a planning deliverable; no application or test code was changed and no
runtime test command was executed in this task.
