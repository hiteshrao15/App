# BottleBazaar Architecture Implementation Index

This index is not the full contract. Do not implement from this file alone; follow the artifact paths below.

## Upstream Artifacts Consumed
- `constitution.md` — modernization guardrails: bounded Java/Spring rewrite, API compatibility, compliance enforcement and runtime gates.
- `project-profile.yaml` — repository structure, languages, rewrite classification and transformation context.
- `clarification.md` — not present in the supplied artifact directory; no clarification contract was available.

## Evidence Mapping
- `constitution.md` — API compatibility and reversible migration guardrails → `wire_contracts.yaml`, `migration_boundary.yaml`, `seams.yaml`.
- `project-profile.yaml` — monorepo module structure and Express/PostgreSQL/Redis to Spring target → `project-structure.md`, `tech-stack.md`, `unit_graph.yaml`.

## Global artifacts
- `unit_graph.yaml` — unit triggers, source anchors, dependencies and exported signatures. Filter by assigned `name`; source anchors are evidence, not rewrite scope.
- `migration_boundary.yaml` — implementation scope. Use `must_rewrite`; do not infer scope from every source anchor.
- `wire_contracts.yaml` — REST request/response/auth/error contracts. Filter `unit`; preserve `frozen` rows exactly.
- `shared_modules.yaml` — shared middleware/database/cache registry. Filter `used_by_units`; use only fields named in that unit's `shared_refs`.
- `cross_unit_state.yaml` — bearer, age and Redis flows. Filter writer/reader units; runtime-confirm rows marked `must_confirm: runtime`.
- `seams.yaml` — declared/inferred cuts and bridge mappings. Filter `cut_between`; declared frozen-side rules are authoritative.
- `project-structure.md`, `tech-stack.md`, `data-model.md` — global source evidence for structure, existing stack and schema.

## Implementation Guide
Every implementation worker must report artifact paths read, implemented `must_preserve`/`must_appear_in_target` items, unresolved/deferred contracts, and tests/build/runtime evidence.

### Unit: auth
- external trigger: POST `/api/v1/auth/request-otp`, `/verify-otp`, `/logout`
- read `units/auth/{behavior,bindings,unit_decomposition}.yaml`; filter global rows `unit: auth`.
- completion evidence: OTP hashing/rate limits, generic errors, session/audit persistence, compatible responses.
### Unit: user-profile
- external trigger: `/api/v1/users/me*`
- read `units/user-profile/*`; filter cross-unit flows where reader/writer is `user-profile`.
- completion evidence: authenticated profile and immutable age declaration semantics.
### Unit: store-discovery
- external trigger: `/api/v1/stores*`
- read `units/store-discovery/*`; filter wire/shared/seam rows for `store-discovery`.
- completion evidence: approved visibility, geo/locality filters, ownership and cache behavior.
### Unit: catalog
- external trigger: `/api/v1/products*`, `/api/v1/categories`
- read `units/catalog/*`; filter global rows `unit: catalog`.
- completion evidence: active product/category read contracts and admin authorization.
### Unit: offers
- external trigger: `/api/v1/offers*`
- read `units/offers/*`; filter dependencies and contracts for `offers`.
- completion evidence: validation, owner checks, lifecycle transitions, cache/audit behavior.
### Unit: redemption
- external trigger: `/api/v1/redemptions/{issue,validate,history}`
- read `units/redemption/*`; filter wire rows and cross-unit age/Redis flows.
- completion evidence: 30-minute hashed single-use token, age gate, row locks, replay/expiry errors.
### Unit: engagement
- external trigger: `/api/v1/favorites*`, `/api/v1/notifications*`
- read `units/engagement/*`; filter global rows for `engagement`.
- completion evidence: user-scoped favorites and notification read state.
### Unit: search-config
- external trigger: `/api/v1/search*`, `/api/v1/config*`
- read `units/search-config/*`; filter global rows `unit: search-config`.
- completion evidence: search/suggestion and public config contracts.
### Unit: admin-governance
- external trigger: `/api/v1/admin/*`
- read `units/admin-governance/*`; filter moderation, audit, config and seam rows.
- completion evidence: role separation, moderation cascades, analytics and audit/config writes.

## Required verification
Architect smoke verification is separate from tester coverage: run the full project build and startup probes after implementation. Runtime endpoint probes must include `/health`, auth, discovery and redemption contract paths. No unit decomposition candidate is committed (`commit: false`).
