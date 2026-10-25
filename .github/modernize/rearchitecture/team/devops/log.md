## [t10] Prepared modernization toolchain contract
- Codebase/domain discoveries: the repository currently has Express/Expo SDK 57 and Docker Compose infrastructure; no Java service exists yet.
- Wrong assumptions and corrections: the workstation has Java 26 and Node 24, not the required Java 21 and Node 20; newer versions cannot be treated as equivalent for the pinned migration target.
- Debugging dead-ends and what actually worked: PowerShell treats `java -version` stderr as a native error, so the preflight captures Java output through `cmd.exe`.
- Techniques/patterns worth reusing: keep selectors at repository root, centralize target versions in an env contract, and fail preflight with an actionable exact-version message.
- Learnings consumed: [(none)]

## [t10] Verified toolchain capability axes
- Codebase/domain discoveries: Docker daemon is functional and Playwright Chromium provisioning is available independently of the runtime-version blockers.
- Wrong assumptions and corrections: CLI presence alone is insufficient; `docker info` and a Playwright install dry-run were required capability checks.
- Debugging dead-ends and what actually worked: the strict preflight intentionally stops at the first Java mismatch, so independent probes are needed to document later capabilities.
- Techniques/patterns worth reusing: keep Java/Node version gates strict while recording independent Docker/browser readiness; do not downgrade requested target versions.
- Learnings consumed: [devops/toolchain-pinning]

## [t10] Activated Java 21 and Node 20 toolchains
- Codebase/domain discoveries: Java 21.0.12.1 is available via Temurin and Node 20.20.2 via NVM for Windows; Docker and Playwright were already operational.
- Wrong assumptions and corrections: the direct Node 20 winget MSI requires administrator elevation and returned installer error 1603; NVM was the approved working alternative.
- Debugging dead-ends and what actually worked: NVM required explicit `NVM_HOME`/`NVM_SYMLINK` environment variables in the current PowerShell process; adding the Node 20 managed directory to PATH produced the correct runtime.
- Techniques/patterns worth reusing: activate `JAVA_HOME` and the NVM-managed Node directory explicitly before running the strict preflight; verify Docker daemon and browser provisioning independently.
- Learnings consumed: [devops/toolchain-pinning]
## [t11] Spring Boot scaffold and migration seam
- Codebase/domain discoveries: no Java service existed; the existing API remains under `services/api`, so `services/api-java` is additive.
- Wrong assumptions and corrections: running Maven from repo root fails because the new POM is scoped to `services/api-java`; CI and local commands must set that working directory.
- Debugging dead-ends and what actually worked: Maven wrapper generation returned non-zero after creating scripts; pinning the generated distribution URL to Maven 3.9.16 leaves a deterministic wrapper seam while CI uses setup-java cache.
- Techniques/patterns worth reusing: keep health/readiness and correlation IDs in platform package; bind migration flags from environment and document rollback without embedding deployment secrets.
- Learnings consumed: [devops/toolchain-pinning]
