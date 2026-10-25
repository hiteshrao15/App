## [t1] Established modernization constitution
- Codebase/domain discoveries: README and architecture docs describe Expo mobile, React/Vite admin,
  Express API, PostgreSQL 16, Redis 7, in-store-only redemption, age gates, and replay protection.
- Wrong assumptions and corrections: no prior constitution, context.md, decisions.md, architect log, or
  inbox existed; ratification date is therefore explicitly deferred.
- Debugging dead-ends and what actually worked: the PowerShell version lacks Get-Date -AsUTC; used
  [DateTime]::UtcNow instead.
- Techniques/patterns worth reusing: treat the Java rewrite as a bounded rewrite with API seams,
  additive migrations, server-side compliance enforcement, and endpoint/runtime gates.
- Learnings consumed: [(none)]

## [t3] Analyzed existing BottleBazaar architecture
- Codebase/domain discoveries: 9 externally triggered API units cover auth, profile, store discovery, catalog, offers, redemption, engagement, search/config, and admin governance. Express routes perform SQL, authorization, Redis rate limiting/cache, and audit writes inline.
- Wrong assumptions and corrections: requested clarification artifact was not present; constitution and project profile were available. The repository README describes a broader multi-city seed, but the modernization request narrows target behavior to Sohna/Gurugram.
- Debugging dead-ends and what actually worked: schema and route anchors were extracted with `rg` and focused source reads; per-unit completeness was verified with PowerShell counts.
- Techniques/patterns worth reusing: preserve `/api/v1` contracts through an explicit Spring seam; keep source anchors distinct from `must_rewrite`; record row-lock redemption and age-gate state flows.
- Learnings consumed: [architect/constitution-governance]

## [t4] Designed target Spring architecture and contracts
- Codebase/domain discoveries: The nine existing API units can remain a modular
  monolith while preserving one transaction boundary for eligibility and QR
  redemption; the `/api/v1` seam is the primary compatibility contract.
- Wrong assumptions and corrections: The user request does not require microservices;
  explicit package/module ports provide extraction seams without introducing
  distributed redemption races.
- Debugging dead-ends and what actually worked: `context.md` and `decisions.md` were
  absent; `board.md`, `spec.md`, `clarification.md`, and structured architecture
  artifacts provided sufficient evidence.
- Techniques/patterns worth reusing: Put policy checks in a reusable domain service,
  map DTOs explicitly to frozen camelCase contracts, and use an outbox for audit and
  analytics projection after the business transaction.
- Learnings consumed: [architect/constitution-governance, architect/spring-api-cutover-seam]
