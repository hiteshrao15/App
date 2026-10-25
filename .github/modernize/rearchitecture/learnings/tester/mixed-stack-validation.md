# Mixed-stack validation

For BottleBazaar, runtime confidence requires Spring API contract/integration tests plus Playwright against the Expo web and admin clients.

## What Happened
Task t8 established that the rewrite has independent infrastructure and browser capabilities. Existing API tests can preserve semantic coverage, but no browser E2E suite was present, so new multi-step Playwright journeys are required.

## Takeaway
Never use Docker availability as a reason to skip Playwright. Attempt Testcontainers and Playwright independently, document exact fallback evidence, and make age/geography, atomic QR replay protection, dry-day blocking, audit redaction, and API compatibility explicit release gates.

## History
- 2026-10-25 (BottleBazaar/t8): initial
