## User Input

> Work directly in H:\App on the BottleBazaar repository. The user has supplied a 2047-line master development prompt in the attached pasted text; its core requirement is a production-ready liquor discovery, store catalogue, discount reservation, and in-store QR redemption platform with customer, merchant, and admin roles; real backend/database/auth/business logic; responsive mobile and admin UX; legal age gates, dry-day controls, inventory, analytics, testing, and documentation. Existing repo is a TypeScript monorepo with Expo mobile, React/Vite admin, Express/PostgreSQL/Redis API. Do not blindly replace working code. Inspect the full repository and implement the highest-value complete rewrite/modernization needed to satisfy the requirements end-to-end. Use existing stack unless a change is necessary. Fix root causes, preserve working functionality, and run targeted builds/tests. Return a concise report of files changed, behavior implemented, validation results, and any concrete blockers. Do not only produce a plan; execute implementation.

**Project started**: 2026-10-25T05:50:00Z

## Tasks

### Phase: Discovery and Guardrails
- ✅ t1 [architect] Establish BottleBazaar modernization constitution (2026-10-25T05:55:52Z→2026-10-25T05:56:37Z, 45s)
- ✅ t2 [pm] Inventory BottleBazaar features and workflows (2026-10-25T05:57:23Z→2026-10-25T05:58:34Z, 71s) [deps: t1]
- ✅ t3 [architect] Analyze existing BottleBazaar architecture (2026-10-25T05:57:23Z→2026-10-25T06:00:05Z, 162s) [deps: t1]

### Phase: Target Architecture and Experience
- ✅ t4 [architect] Design target BottleBazaar architecture and contracts (2026-10-25T06:01:19Z→2026-10-25T06:02:19Z, 60s) [deps: t2, t3]
- ✅ t5 [dba] Design fresh BottleBazaar schema and migration strategy (2026-10-25T06:01:03Z→2026-10-25T06:05:12Z, 249s) [deps: t2, t3]
- ✅ t6 [ux] Design BottleBazaar cross-platform user experience (2026-10-25T06:01:18Z→2026-10-25T06:02:30Z, 72s) [deps: t2]

### Phase: Implementation Planning
- ✅ t7 [teamlead] Create implementation plan and task breakdown (2026-10-25T06:03:27Z→2026-10-25T06:05:17Z, 109s) [deps: t4, t5, t6, t8]
- ✅ t8 [tester] Define end-to-end testing and validation strategy (2026-10-25T06:01:09Z→2026-10-25T06:01:58Z, 50s) [deps: t3]
- ✅ t9 [teamlead] Validate implementation plan completeness and traceability (2026-10-25T06:05:58Z→2026-10-25T06:06:48Z, 50s) [deps: t7, t8]

### Phase: Environment
- ✅ t10 [devops] Prepare Java 21 Spring Boot 3.5 Maven Node Expo Docker and browser toolchains (2026-10-25T06:14:52Z→2026-10-25T06:22:11Z, 439s) Spring Boot 3.5 Maven Node Expo Docker and browser toolchains

### Phase: Scaffold
- ✅ t11 [devops] Scaffold Spring Boot service CI structure and migration infrastructure (2026-10-25T06:23:03Z→2026-10-25T06:26:19Z, 196s) CI structure and migration infrastructure [deps: t10]

### Phase: Foundation
- ⏳ t12 [dba] Create Flyway schema deterministic Sohna/Gurugram seed data persistence ports and import rollback mappings [deps: t10, t11]
- ⏳ t13 [security] Implement Spring Security role authorization authentication protection and secure configuration foundations [deps: t10, t11]
- ⏳ t14 [backend] Implement compatible API contracts error envelopes correlation IDs audit outbox observability and Redis adapters [deps: t10, t11, t12]
- ⏳ t15 [devops] Implement CI verification feature-flag rollback cutover and operational migration runbooks [deps: t10, t11]

### Phase: Implementation
- ⏳ t16 [backend] Implement OTP email-password authentication sessions age eligibility geography and public compliance configuration [deps: t12, t13, t14]
- ⏳ t17 [backend] Implement store discovery catalogue search inventory visibility and compatible customer APIs [deps: t12, t14, t16]
- ⏳ t18 [backend] Implement offers claims wallet tokens and atomic cashier QR redemption with replay protection [deps: t12, t13, t14, t17]
- ⏳ t19 [backend] Implement merchant stores licences inventory offers profile preferences favorites and notifications [deps: t12, t13, t14, t18]
- ⏳ t20 [backend] Implement moderation governance dry-day configuration audit and scoped merchant-admin analytics [deps: t12, t13, t14, t18, t19]
- ⏳ t21 [frontend] Implement Expo customer authentication eligibility discovery and catalogue journeys for iOS Android and web [deps: t16, t17]
- ⏳ t22 [frontend] Implement Expo offers wallet claim QR and customer redemption journeys with policy states [deps: t18, t21]
- ⏳ t23 [frontend] Implement merchant moderator and administrator workspaces for stores inventory governance and analytics [deps: t19, t20]
- ⏳ t24 [ux] Apply premium accessible bilingual responsive design tokens shared components performance states and forbidden-action removal [deps: t21, t22, t23]
- ⏳ t25 [devops] Configure deployment containers environment settings monitoring and release automation [deps: t15, t16, t17, t18, t19, t20, t24]
- ⏳ t26 [security] Scan and remediate Maven and frontend dependency CVEs via skill(cve-remediation) then verify patched builds [deps: t11, t16, t17, t18, t19, t20, t21, t22, t23, t24, t25]

### Phase: Review
- ⏳ t27 [architect] Review implementation against target architecture contracts persistence boundaries and compatibility seams [deps: t16, t17, t18, t19, t20, t21, t22, t23, t24, t25, t26]
- ⏳ t28 [security] Audit authentication authorization validation secrets privacy audit logging and OWASP risks [deps: t16, t17, t18, t19, t20, t21, t22, t23, t24, t25, t26]
- ⏳ t29 [ux] Review visual polish accessibility responsive behavior localization and customer merchant admin usability [deps: t21, t22, t23, t24]

### Phase: Validation
- ⏳ t30 [tester] Run independent full-build smoke test and verify service startup and client artifacts [deps: t10, t11, t12, t13, t14, t15, t16, t17, t18, t19, t20, t21, t22, t23, t24, t25, t26]
- ⏳ t31 [tester] Execute runtime integration contract concurrency browser accessibility and critical behavioral validation [deps: t27, t28, t29, t30]

### Phase: Conformance
- ⏳ t32 [pm] Verify feature parity across requirements endpoints workflows business rules and explicit exclusions [deps: t31]
- ⏳ t33 [teamlead] Review conformance evidence test strategy coverage regressions and quality gate results [deps: t31, t32]

### Phase: Final Validation
- ⏳ t34 [teamlead] Finalize release validation cutover readiness rollback evidence and binary sign-off [deps: t33]






