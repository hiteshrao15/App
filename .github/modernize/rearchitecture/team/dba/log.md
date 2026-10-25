## [t5] Fresh BottleBazaar schema and migration strategy
- Codebase/domain discoveries (gotchas, non-obvious behavior): the current SQL migration is a single transactional PostgreSQL schema with UUIDs, enum statuses, paise prices, JSONB configuration/opening hours, and row-locking redemption flows. The migration runner tracks filenames in `_migrations`.
- Wrong assumptions and corrections: the existing schema does not model email credentials, licence history/evidence, dry days, inventory movements, or immutable redemption events; these must be additive target structures rather than inferred from current tables.
- Debugging dead-ends and what actually worked: no runtime database was available; static inspection plus Mermaid attribute validation verified the design artifact.
- Techniques/patterns worth reusing for future tasks: preserve legacy UUIDs when valid, stage unsupported geography instead of publishing it, and use stable seed keys with idempotent inserts.
- Learnings consumed: [(none)]
