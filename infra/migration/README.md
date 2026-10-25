# Spring cutover and rollback seam

The Java service is introduced beside the existing Express API. Until the
compatibility contract and Flyway schema are validated, the legacy API remains
the default route owner.

## Feature flag

Set `LEGACY_API_ENABLED=true` (the default) to keep the existing API active.
Set it to `false` only in an environment where the Spring service has passed
contract, persistence, and runtime gates. The flag is read from environment
configuration and is never a source-code switch.

The rollout controller should record the flag value, release SHA, schema
version, operator, and timestamp in the deployment audit trail. Do not perform
an irreversible database change as part of a traffic switch.

## Migration sequence

1. Provision a separate PostgreSQL 16 database and apply the versioned Flyway
   migrations from `services/api-java/src/main/resources/db/migration`.
2. Stage legacy exports into `legacy_*` tables and produce stable-ID mappings.
3. Quarantine unsupported geography; only Sohna and Gurugram rows are eligible
   for publication.
4. Run compatibility and smoke probes against the Spring service.
5. Shift traffic by environment flag or router configuration.
6. Roll back by restoring the previous flag/router target. Preserve migrated
   rows and audit evidence; do not delete production data during rollback.

## Operational prerequisites

The cutover requires PostgreSQL 16, Redis 7, secret storage for database/cache
credentials, TLS termination, and dashboards for health, latency, errors,
migration status, and redemption conflicts. Credentials, URLs, and certificates
must be supplied by the deployment environment.
