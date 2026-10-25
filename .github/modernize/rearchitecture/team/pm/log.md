## [t2] BottleBazaar feature and workflow inventory
- Codebase/domain discoveries (gotchas, non-obvious behavior): Existing surfaces already
  cover customer discovery, favorites, wallet vouchers, merchant store/offer flows,
  admin moderation/configuration, and audit routes. The documented API names differ in
  places from route names, so compatibility adapters must be treated as a product
  requirement.
- Wrong assumptions and corrections: The repository README describes many Indian states,
  but the clarified launch scope is only Sohna/Gurugram; the specification limits
  publishable seed/discovery scope accordingly.
- Debugging dead-ends and what actually worked: The dependency artifact path in the task
  metadata was stale; the canonical clarification was found at
  `.github/modernize/rearchitecture/clarification.md`.
- Techniques/patterns worth reusing for future tasks: Separate actor journeys from
  cross-cutting states, assign sequential REQ IDs, and map each requirement back to
  constitution/clarification evidence.
- Learnings consumed: [architect/constitution-governance]
