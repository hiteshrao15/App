# Requirements Quality Checklist

## Requirement ID Coverage

- [x] All functional requirements use `REQ-XXX` format.
- [x] IDs are unique and sequential from REQ-001 through REQ-024.
- [x] Non-functional requirements use a distinct `NFR-XXX` namespace.

## Testability

- [x] Every requirement states an observable behavior or enforceable outcome.
- [x] P1/P2 scenarios use Given/When/Then-style acceptance language.
- [x] Error, empty, expiry, replay, dry-day, and authorization paths are included.
- [ ] Exact response schemas and status codes — to be finalized by architect/backend
  contract work without changing the product behavior defined here.

## Completeness

- [x] Customer, merchant, moderator, administrator, and visitor actors are covered.
- [x] Mobile iOS/Android/web and admin surfaces are covered.
- [x] Discovery, catalogue, inventory, offers, claims, QR redemption, analytics,
  auth, age gate, geography, dry days, audit, and configuration are covered.
- [x] Payments, delivery, and online redemption are explicitly excluded.
- [x] Compatibility, accessibility, localization, loading/error, and compliance
  behaviors are covered.

## Constitution Alignment

- [x] Contract-first compatibility is represented by REQ-023/REQ-024.
- [x] Domain/compliance boundaries are represented by REQ-002–REQ-016.
- [x] Security/privacy and audit are represented by REQ-001, REQ-011–REQ-013,
  REQ-020–REQ-021, and NFR-003.
- [x] Runtime verification and accessibility gates are represented by REQ-024,
  NFR-002, and Success Criteria 6–7.
- [x] Reversible delivery and deterministic launch scope are represented by NFR-004.

## Readiness

- [x] Specification is ready for architecture, schema, UX, and testing planning.
- [ ] Architect must define exact contract schemas and compatibility adapters.
- [ ] Tester must provide explicit proof for critical flows and concurrent replay
  rejection.
