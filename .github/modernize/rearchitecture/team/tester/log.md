## [t8] End-to-end validation strategy
- Codebase/domain discoveries: BottleBazaar is a mixed Expo/web/admin client and REST backend rewrite; existing API tests are under `services/api/src/__tests__`, while no browser suite was found.
- Wrong assumptions and corrections: `context.md`, `decisions.md`, and `clarification.md` were not present at their expected paths; architecture and feature artifacts were used instead, and this absence is documented.
- Debugging dead-ends and what actually worked: PowerShell on this host does not support `Get-Date -AsUTC`; local ISO time was captured with `Get-Date -Format o`.
- Techniques/patterns worth reusing for future tasks: Keep Docker/Testcontainers and Node/Playwright as independent capability axes; explicitly prove age/geography, concurrent single-use redemption, dry-day rejection, and compatibility routes.
- Learnings consumed: [(none)]
