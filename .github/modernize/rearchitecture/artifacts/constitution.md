<!--
Sync Impact Report
- Version change: none (new constitution) -> 1.0.0
- Modified principles: none (initial adoption)
- Added sections: Migration Mode, five Core Principles, Target Technology Stack,
  Product and Regulatory Boundaries, Development Workflow and Quality Gates, Governance
- Removed sections: none
- Templates requiring updates:
  - ✅ H:\App\.github\modernize\rearchitecture\artifacts\constitution.md (this document)
  - ⚠ pending: implementation-plan, feature-specification, and task templates will
    consume these rules in their respective planning tasks
- Follow-up TODOs: ratification date is not present in the supplied project history and
  must be replaced by the approving team when formally adopted.
-->

# BottleBazaar Constitution

## Migration Mode

**Mode**: REWRITE

**Justification**: BottleBazaar is a brownfield rewrite with a mandated Java/Spring Boot
backend and fresh schema, while compatible client contracts and working behavior must be
preserved. The rewrite is therefore bounded by observable behavior and API compatibility,
not by copying the existing implementation. Legacy Node services may remain only while
an explicitly documented compatibility seam is active and verified.

## Core Principles

### I. Contract-First, Compatibility-Bounded Architecture

Every externally observable API, authentication flow, redemption state transition, and
cross-platform route MUST have a documented contract before implementation. Existing
compatible clients MUST continue to work during migration; incompatible changes require
an explicitly versioned endpoint or an adapter, a migration note, and a rollback path.
Internal modules MUST communicate through typed DTOs and stable service interfaces rather
than persistence entities. This prevents client regressions and makes the Java rewrite
incremental and reviewable.

### II. Domain and Boundary Integrity

The target backend MUST use clear boundaries for identity and age gating, catalogue and
inventory, offers and reservations, QR redemption, merchant operations, and
administration. Controllers MUST remain transport-focused; business rules MUST live in
application/domain services; repositories MUST isolate persistence. Payments, delivery,
and online alcohol redemption MUST remain outside the product boundary. Sohna and
Gurugram MUST be the only launch geography, with location and licence checks enforced at
the service boundary rather than trusted solely to clients.

### III. Security, Excise Compliance, and Privacy by Default

Phone OTP and email/password authentication MUST be implemented with secure credential
handling, rate limits, expiry, replay protection, and auditable security events.
Age-gate decisions, dry-day rules, licence validity, and store eligibility MUST be
server-enforced. QR reservations MUST be single-use, time-bounded, idempotent under
concurrent scans, and redeemable only in-store by an authorized merchant. Sensitive
personal data MUST be minimized, masked in merchant views, encrypted in transit, and
excluded from logs; secrets MUST come from environment or managed secret storage.

### IV. Behavioral Verification and Accessibility Are Release Gates

Each migrated flow MUST have characterization evidence from the current behavior where
available, contract tests for the API, and integration or end-to-end tests for critical
journeys. A release MUST demonstrate discovery, catalogue browsing, offer reservation,
merchant QR redemption, replay rejection, authentication, age gating, and dry-day
blocking. The mobile and web experiences MUST meet WCAG 2.1 AA, support keyboard and
screen-reader operation where applicable, provide meaningful loading/error states, and
target the latest two major versions of Chrome, Firefox, Safari, and Edge. A passing
compile alone is not sufficient.

### V. Observable, Reversible Delivery

The system MUST emit structured, correlation-ID-aware logs and metrics for authentication,
catalogue/search, reservations, redemptions, authorization failures, and external
provider failures, without logging secrets or unnecessary personal data. Database and
API changes MUST be additive and reversible until the cutover is verified. Every
production change MUST identify health checks, migration order, rollback conditions, and
owner-visible audit evidence. Performance MUST meet or exceed the existing production
baseline; any regression requires a documented exception and remediation plan.

## Target Technology Stack

| Component | Target Version | Notes |
|-----------|---------------|-------|
| JDK | 21 LTS | Implementation MUST pin the exact patch version in CI and local guidance. |
| Framework | Spring Boot 3.5.x | Use the latest compatible 3.5 patch selected during implementation. |
| Build Tool | Maven 3.9.x | Reproducible dependency locking and CI build. |
| Database | PostgreSQL 16 | Fresh schema with versioned migrations and deterministic seeds. |
| Cache/coordination | Redis 7.x | Rate limits, short-lived reservation locks, and hot reads only. |
| Client | Expo / React Native | iOS, Android, and web; preserve compatible routes and shared types. |

## Product and Regulatory Boundaries

The launch geography is Sohna and Gurugram only. Customer discovery, licensed store
catalogues, discounts, reservations, and in-store QR redemption are in scope, as are
merchant inventory and analytics and administrative moderation, dry-day configuration,
audit, and analytics. No payment processing, alcohol delivery, or online redemption may
be introduced. State-excise rules, statutory warnings, licence metadata, legal-age
thresholds, and dry-day configuration MUST be data-driven and auditable. Seed data MUST
be safe, deterministic, clearly non-production, and limited to supported launch scope.

## Upstream Artifacts Consumed

- `H:\App\.github\modernize\rearchitecture\clarification.md` — authoritative scope,
  target platforms, authentication modes, compatibility requirement, and exclusions.

## Evidence Mapping

- `clarification.md#Backend` → Migration Mode, Target Technology Stack, and
  Contract-First, Compatibility-Bounded Architecture.
- `clarification.md#Generic` → Product and Regulatory Boundaries and
  Security, Excise Compliance, and Privacy by Default.
- `clarification.md#Frontend` → Behavioral Verification and Accessibility Are Release
  Gates and the Expo client target.

## Development Workflow and Quality Gates

Plans and specifications MUST include a Constitution Check covering every principle.
Implementation tasks MUST identify the contract or behavior they preserve, the owning
boundary, security implications, and verification evidence. Architectural decisions
that change a boundary, data contract, target version, or compliance rule MUST be
recorded before implementation and broadcast to all roles. Pull requests MUST pass
formatting/static analysis, unit tests, contract tests, integration tests for changed
boundaries, and the full build. Backend changes MUST include runtime endpoint probes;
client changes MUST include platform-appropriate smoke coverage. Failed gates are
blocking unless an approving owner records a time-bounded exception.

## Governance

This constitution governs architecture, implementation plans, task breakdowns, reviews,
and release verification for the BottleBazaar modernization. Amendments require a
written rationale, impact assessment, affected-contract list, migration or rollback
plan, and approval from the architecture owner and project coordinator. Versioning uses
semantic versioning: MAJOR for incompatible principle or boundary changes, MINOR for a
new or materially expanded principle, and PATCH for clarifications that do not change
obligations. Every amendment MUST update the Sync Impact Report, amendment date, and
downstream template references. Architecture and quality-gate reviews MUST verify
compliance at planning, pre-release, and post-cutover checkpoints; unresolved
violations are escalated rather than silently waived.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): formal approval date not supplied | **Last Amended**: 2026-10-25
