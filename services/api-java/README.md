# BottleBazaar Spring Boot API

The target backend deployable for the Java migration. The service is deliberately
small at scaffold time: domain modules and Flyway migrations are added behind
the `/api/v1` compatibility boundary in later foundation tasks.

## Requirements

- Java 21 (activate the repository toolchain described in `infra/TOOLCHAINS.md`)
- Maven 3.9.x

## Commands

```powershell
mvn -B verify
mvn -B spring-boot:run
```

Health probes are available at `/actuator/health`, `/actuator/health/liveness`,
and `/actuator/health/readiness`. Every response includes an `X-Correlation-Id`
header. Database and Redis settings are intentionally not committed; later
profiles bind them from environment variables.
