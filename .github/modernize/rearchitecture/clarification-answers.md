---
schema: clarification-answers/v1
status: submitted
generated_at: "2026-10-25T05:46:52.915Z"
scope: [frontend, backend, generic]
questions_file: clarification-questions.json
---

# Rearchitecture Clarification Answers

## 🖥️ Frontend

- **F1** Confirm the frontend targets and versions for mobile and admin surfaces.
  - answer: Redesign it completly and make it best in class
  - source: user
- **F2** Which component library or design-system approach should be used for the responsive mobile and admin UX?
  - answer: MUI
  - source: user
- **F3** Provide screenshot or design references if available; otherwise allow implementation from existing screens and requirements.
  - answer: No external screenshots; use existing UI and requirements as the visual baseline.
  - source: default applied

## ⚙️ Backend

- **B1** How should API compatibility be handled while completing the backend?
  - answer: Preserve existing contracts and extend compatibly
  - source: user
- **B2** What data migration strategy should be used for existing PostgreSQL data and schema?
  - answer: Additive, reversible migrations preserving existing data
  - source: user

## 📋 General

- **G1** Where should the modernization be implemented?
  - answer: In place
  - source: user
- **G2** Which compliance constraints must be enforced?
  - answer: Legal age gate, dry-day and jurisdiction controls, PII protection, and auditable redemption.
  - source: user
- **G3** What validation level is expected before completion?
  - answer: Targeted builds and tests
  - source: user
- **G4** Which delivery scope should be prioritized if the full master prompt exceeds one iteration?
  - answer: End-to-end critical path
  - source: user
- **G5** Add any additional constraints or decisions.
  - answer: Do not blindly replace working code; preserve existing functionality and use the current stack unless necessary.
  - source: user
