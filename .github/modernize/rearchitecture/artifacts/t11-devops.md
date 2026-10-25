# t11 — Spring Boot scaffold and migration infrastructure

## Summary

Created the Java 21/Spring Boot 3.5.6 service boundary at
`services/api-java`, with Maven wrapper metadata, deterministic configuration,
health/readiness probes, correlation IDs, an application-context test, and a
CI workflow. Added an operational migration/cutover runbook that keeps the
legacy Express API as the reversible default until contract and persistence
gates pass.

## Upstream Artifacts Consumed

- `artifacts/constitution.md#Target Technology Stack` — Java 21, Spring Boot
  3.5.x, Maven 3.9.x, reproducible and reversible delivery.
- `artifacts/plan.md#Plan 1.1` — scaffold, profiles, probes, correlation filter,
  and CI acceptance scope.
- `artifacts/t4-architect.md#Target Runtime Shape` — modular monolith,
  `/api/v1` compatibility seam, and no unrelated replacement.
- `artifacts/t5-dba.md#Migration Sequence` — separate fresh database, staged
  import, quarantine, and rollback requirements.
- `artifacts/t10-devops.md#Target Environment Preparation` — activated Java 21
  and Node 20 toolchain evidence.

## Evidence Mapping

- `constitution.md#Target Technology Stack` → `services/api-java/pom.xml`,
  Maven wrapper distribution `3.9.16`, and CI Java `21.0.12`.
- `plan.md#Plan 1.1 / T001-T004` → service package, profiles, health probes,
  correlation filter, README, and `.github/workflows/ci.yml`.
- `t4-architect.md#Target Runtime Shape` → standalone `bottlebazaar-api`
  deployable; no legacy Express files modified.
- `t5-dba.md#Migration Sequence` → `infra/migration/README.md` staged import,
  geography quarantine, feature-flag cutover, and rollback instructions.

## Files Changed

- `services/api-java/pom.xml`
- `services/api-java/mvnw`, `mvnw.cmd`, `.mvn/wrapper/maven-wrapper.properties`
- `services/api-java/src/main/java/com/bottlebazaar/platform/BottleBazaarApplication.java`
- `services/api-java/src/main/java/com/bottlebazaar/platform/http/CorrelationIdFilter.java`
- `services/api-java/src/main/resources/application.yml`
- `services/api-java/src/main/resources/application-test.yml`
- `services/api-java/src/test/java/com/bottlebazaar/platform/BottleBazaarApplicationTest.java`
- `services/api-java/README.md`
- `.github/workflows/ci.yml`
- `infra/migration/README.md`

## Test Results

- Command: `mvn -B --no-transfer-progress verify` from `services/api-java`
- Passed: 1 test
- Failed: 0
- Skipped: 0
- Build: PASS; Spring Boot jar packaged successfully on Java `21.0.12.1`
- Runtime probe: `GET http://localhost:8080/actuator/health` → HTTP 200 and
  non-empty `X-Correlation-Id`
- Wrapper generation initially returned exit code 1 after creating scripts;
  `maven-wrapper.properties` was corrected to the pinned Maven `3.9.16`
  distribution. `.\mvnw.cmd -B --no-transfer-progress verify` subsequently
  passed with 1 test and 0 failures.

## Operational Blockers

- PostgreSQL 16, Redis 7, secret storage, TLS, and observability backends are
  deployment prerequisites; no credentials or environment-specific endpoints
  are committed.
- Flyway migrations and domain endpoints are intentionally owned by later
  foundation tasks (t12+); this scaffold does not claim database readiness.
