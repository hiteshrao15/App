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
