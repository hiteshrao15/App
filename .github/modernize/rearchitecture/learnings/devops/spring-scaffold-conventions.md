# Spring Scaffold Conventions

The initial Spring service uses Maven wrapper metadata, environment-bound configuration, and a correlation-ID response filter as stable operational seams.

## What Happened

For t11, `services/api-java` was added as a standalone Spring Boot 3.5.6
deployable targeting Java 21. Health/readiness are exposed through Actuator,
while `LEGACY_API_ENABLED` remains environment-controlled for reversible
cutover. No database credentials or URLs are embedded.

## Takeaway

Keep platform concerns (health, correlation, migration flags, and environment
binding) in the service scaffold; later domain tasks should add `/api/v1`
controllers and Flyway migrations without bypassing these seams.

## History

- 2026-10-25 (BottleBazaar/t11): initial
