# Modular Monolith Redemption Boundary

Keep BottleBazaar's initial Spring target as a modular monolith so compliance and single-use redemption remain one database transaction.

## What Happened

Task t4 designed explicit identity, eligibility, discovery, catalog, offers, redemption,
engagement, governance, and analytics modules inside one Spring Boot deployable. Ports
and DTO mappers preserve future extraction seams while avoiding distributed race
conditions during QR validation.

## Takeaway

Centralize age, geography, licence, dry-day, and maintenance policy in an application
service invoked by browsing, claim, and redemption. Use row locking plus a unique
consumption constraint for redemption; publish audit/analytics events through an
outbox only after the domain transaction commits.

## History

- 2026-10-25 (BottleBazaar/t4): initial
