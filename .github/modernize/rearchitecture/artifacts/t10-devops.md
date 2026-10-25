# t10 — Environment Toolchain Preparation

## Summary

Added repository-level version selectors and a strict PowerShell preflight for
the Java/Spring Boot, Maven, Node/Expo, Docker Compose, and Playwright
toolchains. The target contract is Java 21, Spring Boot 3.5.x, Maven 3.9.x,
Node 20/npm 10, Expo SDK 57, Docker Compose v2, and Playwright 1.64.x.

## Deliverables

- `.java-version` — selects Java 21 for version managers.
- `.nvmrc` — selects Node 20.
- `infra/toolchain-versions.env` — shared target-version contract (ignored by
  the repository's environment-file rule but present in the working tree).
- `infra/toolchain-preflight.ps1` — strict executable validation.
- `infra/TOOLCHAINS.md` — activation, browser-install, and CI guidance.

## Environment Evidence

- Java/Javac: Temurin `21.0.12.1` active from
  `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot`.
- Maven: `3.9.16` active (compatible with the required 3.9 line).
- Node/npm: Node `v20.20.2` with npm `10.8.2`, installed and selected through
  NVM for Windows (`C:\Users\hites\AppData\Local\nvm`).
- Expo CLI: `57.0.32` via `npx`.
- Docker: Engine `29.6.1`; Docker Compose `v5.3.0` (Compose v2).
- Playwright CLI: `1.64.1` via `npx`; Chromium installation completed with exit
  code 0 (`npx playwright install chromium`).
- Docker daemon: available (`docker info --format 'Server={{.ServerVersion}}'`
  reported `Server=29.6.1`, exit code 0).

## Verification

### Test Results

- Command: `.\infra\toolchain-preflight.ps1`
- Passed: 1 (all Java, javac, Maven, Node, npm, Expo, Docker Compose, and
  Playwright gates)
- Failed: 0
- Skipped: 0
- Exit code: 0
- Independent probes: exact Java/Javac/Maven, Node/npm/Expo, Docker/Compose,
  Docker daemon, and Playwright CLI checks all succeeded.
- Browser provisioning: `npx playwright install chromium` exit code 0.

## Target Environment Preparation

Status: READY

Java 21 was installed with winget (`EclipseAdoptium.Temurin.21.JDK`,
21.0.12.101). Node 20 was installed with NVM for Windows (winget package
`CoreyButler.NVMforWindows`, NVM-managed Node 20.20.2). The direct Node.js 20
winget MSI attempt returned installer error 1603 (administrator elevation);
NVM provided the approved, reproducible alternative. No application source or
credentials were changed.

### Activation commands

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
$env:NVM_HOME='C:\Users\hites\AppData\Local\nvm'
$env:NVM_SYMLINK='C:\nvm4w\nodejs'
$env:Path="$env:JAVA_HOME\bin;$env:NVM_HOME\v20.20.2;C:\Users\hites\AppData\Roaming\npm;$env:Path"
```

Then run `nvm use 20.20.2` in a shell where NVM is available, followed by
`.\infra\toolchain-preflight.ps1`. The tested shell resolved all requested
versions and returned exit code 0.

## Upstream Artifacts Consumed

- `artifacts/constitution.md#Target Technology Stack` — exact target versions
  and reproducibility requirement.
- `artifacts/plan.md#Technical Context` — Java/Spring/Maven, Expo, Docker,
  PostgreSQL, Redis, and test tooling expectations.
- `artifacts/t4-architect.md` — modular Spring Boot service and compatibility
  seam constraints.
- `clarification.md#Generic` — migration scope and exclusions.

## Evidence Mapping

- `constitution.md#Target Technology Stack` → `.java-version`,
  `.nvmrc`, `infra/toolchain-versions.env`, and `TOOLCHAINS.md`.
- `plan.md#Plan 1.1` → executable preflight and documented Java/Maven activation
  path for the Java service scaffold.
- `t4-architect.md#Target architecture` → no changes to application behavior;
  environment-only preparation preserves the rollback seam.
