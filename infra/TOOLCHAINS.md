# BottleBazaar toolchains

This repository's modernization target is intentionally pinned so local and CI
builds use the same major versions:

| Tool | Required version | Configuration |
| --- | --- | --- |
| JDK | 21 (exact patch pinned by CI) | `.java-version`, `JAVA_HOME` |
| Spring Boot | 3.5.x (currently 3.5.6) | `services/api-java/pom.xml` |
| Maven | 3.9.x (3.9.15 in CI) | Maven Wrapper generated with the Java service |
| Node/npm | Node 20 / npm 10 | `.nvmrc`, root `package.json` engines |
| Expo | SDK 57 | `apps/mobile/package.json` |
| Docker Compose | v2 | `infra/docker-compose.yml` |
| Browser checks | Playwright 1.64.x | `npx playwright` |

## Local preflight

From `H:\App`, install/activate JDK 21 and Node 20, then run:

```powershell
$env:JAVA_HOME = "<path-to-jdk-21>"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
npm ci
.\infra\toolchain-preflight.ps1
```

The preflight is deliberately strict: Java 26, while newer, is not a
substitute for the Java 21 target because Spring Boot and CI must be tested on
the declared runtime. The current workstation has Java 26 active and therefore
must activate a JDK 21 installation before running the Java service.

## Browser binaries

The browser test owner may install pinned binaries with:

```powershell
npx playwright install chromium firefox webkit
```

Do not commit browser caches. Docker Compose remains the supported local
PostgreSQL/Redis dependency runtime; no credentials belong in this repository.

## Verification contract

`infra/toolchain-preflight.ps1` is the single local check for the environment.
CI should run it (or equivalent checks) before Maven, Expo, and browser jobs.
