# Fresh Schema Migration

BottleBazaar's fresh PostgreSQL schema should retain legacy UUID contracts while adding compliance and reporting tables through additive migrations.

## What Happened

For t5, the existing migration was a single PostgreSQL file and the runner used filename tracking with transactional application. The target design therefore keeps core table names and redemption locking semantics, while introducing `store_licenses`, `dry_days`, `inventory_movements`, `redemption_events`, credentials, and analytics as separate versioned migrations.

## Takeaway

Use staging tables and stable source-to-target mappings for legacy data; quarantine unsupported geography or unverifiable licences instead of silently publishing them. Never roll back immutable redemption/audit evidence by deleting rows.

## History
- 2026-10-25 (BottleBazaar/t5): initial
