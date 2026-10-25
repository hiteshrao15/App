
[architect t1] Architecture guardrails established: bounded Java/Spring Boot rewrite with API compatibility, server-side excise/compliance enforcement, single-use in-store QR redemption, WCAG 2.1 AA, additive/reversible migrations, and runtime verification gates.

[architect t4] Target is a modular Spring Boot monolith behind frozen /api/v1; centralized compliance; transactional single-use QR redemption; no payments, delivery, or online redemption.

[architect t4] Preserve camelCase envelopes, paise integers, ISO-8601 timestamps, 401/403 distinction, frozen OTP/redemption paths, and Redis key/TTL semantics; use DTO mappers and an outbox-backed audit/event boundary.

[dba t5] Schema preserves UUID/core table contracts and row-lock redemption semantics; additive tables include password_credentials, store_licenses, dry_days, inventory_movements, redemption_events, analytics_events.

[dba t5] Fresh-database cutover uses staged import, batched backfills, concurrent indexes where supported, rollback by connection/feature flag, and lock/replication monitoring.

[ux t6] Preserve customer tab/deep-link IDs; implement city/age gating, discovery, Wallet QR presentation, responsive accessible layouts, bilingual behavior, and role-based admin workspace.

[ux t6] Backend needs pagination/filter metadata, eligibility reason codes, voucher payloads, distinct redemption outcomes, public compliance configuration, and compatibility adapters.

[dba t5] Schema change notification: consume additive password_credentials, store_licenses, dry_days, inventory_movements, redemption_events, analytics_events.
