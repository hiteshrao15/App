# Toolchain Pinning for BottleBazaar

Repository and CI must activate Java 21 and Node 20 explicitly; newer installed runtimes are not substitutes for the declared modernization target.

## What Happened

For t10, the workstation resolved Java 26.0.1 and Node 24.8.0 while the
constitution requires Java 21 and Node 20. A strict PowerShell preflight and
version selectors were added so this mismatch fails early rather than producing
an unverified Spring or Expo build.

## Takeaway

Run `infra/toolchain-preflight.ps1` after activating the requested runtimes.
Capture Java version output through `cmd.exe` in PowerShell because `java
-version` writes to stderr and otherwise appears as a terminating native error.

## History

- 2026-10-25 (BottleBazaar/t10): initial
- 2026-10-25 (BottleBazaar/t10): verified Docker daemon and Playwright browser capability independently; a Java/Node mismatch must not cause those axes to be treated as unavailable
- 2026-10-25 (BottleBazaar/t10): installed Temurin Java 21.0.12.1 with winget and Node 20.20.2 with NVM after the direct Node MSI required unavailable administrator elevation; strict preflight passed with explicit activation variables
