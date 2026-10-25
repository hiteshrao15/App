## [t6] Cross-platform UX specification
- Codebase/domain discoveries (gotchas, non-obvious behavior): Existing mobile tabs are
  `home`, `discover`, `offers`, `favorites`, `account`, and `wallet`; the UX preserves
  these deep-link identifiers while presenting Wallet as a primary action.
- Wrong assumptions and corrections: README describes legacy non-launch cities; the
  authoritative rewrite scope is Sohna/Gurugram only, so the specification uses only
  those cities.
- Debugging dead-ends and what actually worked: Dependency paths were artifact
  filenames rather than the assignment's shorthand; reading `spec.md` and the
  constitution supplied the authoritative requirements.
- Techniques/patterns worth reusing for future tasks: State every role's primary
  action, failure recovery, keyboard/screen-reader behavior, and API payload need in
  the UX artifact so frontend and backend can implement without inference.
- Learnings consumed: [(none)]
