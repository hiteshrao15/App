# Inventory Scope and Compatibility

Feature inventories should separate observable actor journeys from technical contracts
and explicitly call out documentation-versus-route naming drift.

## What Happened

For BottleBazaar task t2, the existing repository exposed customer, merchant, admin,
and compliance behavior across mobile, admin, and API routes. README/API documentation
uses some names that differ from implementation route names, while clarification
requires compatible behavior during the Java rewrite. The product specification
therefore treats compatibility adapters/versioned equivalents as acceptance criteria,
rather than prescribing an implementation.

## Takeaway

When inventorying a brownfield rewrite, use both user-visible screens and observable
route behavior, preserve the behavior contract even when names differ, and constrain
seed/publish scope to the explicitly resolved launch geography.

## History

- 2026-10-25 (BottleBazaar/t2): initial
