# BottleBazaar Feature Specification

## Scope Baseline

BottleBazaar is a discovery and in-store voucher platform for legal-age customers in
Sohna and Gurugram only. It helps customers find licensed stores and approved offers,
claim a short-lived voucher, and present a QR/code at the participating store counter.
It does not process payments, sell alcohol online, deliver alcohol, or support online
redemption. Merchants manage stores, licences, catalogues, inventory, offers, and
redemption activity. Moderators and administrators manage approvals, compliance
configuration, audit evidence, and analytics.

The rewrite must preserve compatible observable routes and behavior while adding
email/password authentication, Java/Spring Boot services, a fresh schema and
deterministic launch seed data. Existing English/Hindi language support, responsive
Expo iOS/Android/web behavior, and administrative web surfaces remain in scope.

### Actors

- **Customer**: adult consumer discovering stores/offers and presenting vouchers.
- **Merchant/store owner or cashier**: licensed retailer managing operations and
  validating vouchers in-store.
- **Moderator**: reviews stores and offers for publication.
- **Administrator/super administrator**: controls users, compliance configuration,
  dry days, audit, and platform analytics.
- **Unauthenticated visitor**: can see permitted public configuration and health
  information but must pass authentication and age gates before protected discovery.

## User Scenarios & Testing

### Customer journeys

1. **P1 — First visit and authentication**  
   Given a new visitor opens the app, when they choose sign up or log in, then they
   can authenticate with phone OTP or email/password, receive clear validation and
   retry states, and be signed in without exposing credentials or OTP values.
2. **P1 — Legal access and launch location**  
   Given an authenticated customer, when they select Sohna or Gurugram and declare
   the configured legal age, then discovery becomes available only for that supported
   geography and age decision is timestamped. Unsupported locations and under-age
   declarations are blocked with an actionable explanation.
3. **P1 — Discover a store or offer**  
   Given age and location eligibility, when the customer searches, filters, refreshes,
   or opens Home, Discover, or Offers, then only approved, active stores/offers in
   the selected launch area are shown with licence status, terms, validity, inventory
   availability where known, and statutory warning.
4. **P1 — Claim and present a voucher**  
   Given an eligible active offer, when the customer claims it, then a single-use
   time-bounded voucher is issued and displayed in Wallet as a QR plus fallback code,
   with store, offer, expiry, terms, and in-store-only instructions. Expired,
   exhausted, duplicate, dry-day, or ineligible claims are rejected without issuing
   a usable token.
5. **P1 — Voucher lifecycle**  
   Given one or more issued vouchers, when the customer opens Wallet, selects a
   voucher, or returns after expiry/redemption, then status is understandable
   (active, redeemed, expired, cancelled), errors are recoverable, and no payment
   or delivery action is offered.
6. **P2 — Profile and preferences**  
   Given a signed-in customer, when they edit profile, language, favorites,
   notifications, or request account deletion/logout, then the change is confirmed,
   persisted, and protected by authorization.

### Merchant journeys

7. **P1 — Store onboarding and licence**  
   Given a merchant account, when the owner submits or edits store identity,
   address, Sohna/Gurugram location, opening hours, contact details, licence number,
   type, expiry, and evidence, then the store is pending review until approved;
   expired, missing, or rejected licence data prevents publication and redemption.
8. **P1 — Catalogue and inventory**  
   Given an approved store, when its owner manages products, prices, pack details,
   stock state, and stock notes, then customers see only the current publishable
   catalogue and inventory status, while merchant changes are auditable.
9. **P1 — Offer authoring and moderation**  
   Given an authorized merchant, when they create percentage, flat/fixed-price, or
   custom/BOGO terms with validity, limits, and product/store scope, then the offer
   remains draft or pending review until a moderator approves it. Invalid prices,
   dates, limits, unsupported geography, or missing terms are rejected.
10. **P1 — In-store redemption**  
    Given an authorized cashier/merchant and an unexpired voucher for that store,
    when they enter or scan its QR/code and bill amount, then the system verifies
    eligibility, calculates the permitted discount, records an immutable redemption,
    and marks the token redeemed exactly once. A second or concurrent attempt,
    wrong store, dry day, expired token, invalid bill, or unauthorized actor is
    rejected with a reason and audit event.
11. **P2 — Merchant analytics**  
    Given a merchant with activity, when they view analytics, then they can see
    inventory availability, offer claims/redemptions, redemption value/discount,
    expiry/rejection trends, and date/store/product filters limited to their data.

### Moderator and administrator journeys

12. **P1 — Moderation**  
    Given a moderator, when they inspect pending stores or offers, then they can
    approve, reject with reason, suspend, or reinstate according to role; customers
    cannot see rejected/suspended content and every decision is attributable.
13. **P1 — Dry days and compliance configuration**  
    Given an administrator, when they create, edit, activate, or remove a
    jurisdiction/date dry-day rule or legal-age/statutory/platform setting, then
    the effective rule is visible, validated, auditable, and enforced server-side
    for browsing/claims/redemption as applicable.
14. **P1 — User and audit administration**  
    Given an administrator, when they inspect users, suspend/restore accounts,
    review audit logs, or inspect configuration changes, then role restrictions,
    timestamps, actor, target, outcome, and safe PII masking are enforced.
15. **P2 — Platform analytics**  
    Given an administrator, when they view the dashboard, then they can see
    customer/store/offer counts, approval backlog, active inventory, claims,
    redemptions, failures, and trends with date/geography filters.

### Cross-cutting states and accessibility

- Loading, empty, offline/API failure, expired-session, unauthorized, not-found,
  validation, and maintenance states have clear text and a retry/back action.
- Mobile and web flows support keyboard/focus order where applicable, screen-reader
  labels, sufficient contrast, scalable text, and touch targets consistent with
  WCAG 2.1 AA.
- English and Hindi content remains selectable; statutory warnings and compliance
  messages are not hidden by localization.

## Functional Requirements

### Identity, eligibility, and geography

- **REQ-001** The product SHALL support phone OTP and email/password sign-up/login,
  logout, session refresh/revocation, rate limits, expiry, replay protection, and
  safe error messages.
- **REQ-002** The product SHALL enforce a configurable legal-age declaration before
  protected alcohol discovery and record the decision, timestamp, jurisdiction, and
  policy version.
- **REQ-003** The product SHALL restrict launch discovery, stores, offers, claims,
  and redemption to Sohna and Gurugram and reject client attempts to bypass scope.
- **REQ-004** The product SHALL expose configured jurisdictions, statutory warnings,
  support/helpline information, and maintenance state as safe public configuration.

### Discovery, catalogue, and favorites

- **REQ-005** Customers SHALL search products/stores/offers, view suggestions,
  filter by category, discount, location, store, and active validity, and paginate
  or refresh results.
- **REQ-006** Store detail SHALL show verified status, address/contact/directions,
  hours, licence number and validity (without private licence documents), products,
  inventory availability where publishable, and active offers.
- **REQ-007** Customers SHALL add/remove/list favorites for products and stores and
  receive a stable empty state.
- **REQ-008** Product/category views SHALL show name, description, brand/category,
  pack/ABV metadata when available, image fallback, and current store context.

### Offers, vouchers, and redemption

- **REQ-009** Merchants SHALL author percentage, fixed/flat, and custom/BOGO offers
  with terms, dates, product/store, minimum purchase, total and per-customer limits.
- **REQ-010** Only approved, licensed, active, in-scope offers SHALL be claimable;
  moderation actions and reasons SHALL be visible to authorized operators.
- **REQ-011** A successful claim SHALL issue one opaque, single-use, time-bounded
  QR/fallback code tied to customer, offer, and store; token secrets SHALL not be
  logged or exposed in administrative listings.
- **REQ-012** Redemption SHALL atomically validate token status, expiry, store,
  merchant authorization, bill/offer constraints, licence, age/geography, and
  dry-day state before recording one immutable successful consumption.
- **REQ-013** Redemption responses SHALL distinguish invalid, expired, redeemed,
  cancelled, wrong-store, dry-day, unauthorized, and policy-blocked outcomes.
- **REQ-014** Payments, delivery, online alcohol sale, and online redemption SHALL
  not be present as executable product actions.

### Merchant operations

- **REQ-015** Merchants SHALL submit and maintain store identity, Sohna/Gurugram
  address, hours, contacts, licence metadata/evidence, and status.
- **REQ-016** Approved merchants SHALL manage store products, price, stock flag,
  stock note, and last-updated state; changes SHALL be scoped to owned stores.
- **REQ-017** Merchant views SHALL provide redemption history and analytics scoped to
  authorized stores, with safe customer data masking.
- **REQ-018** The system SHALL provide notifications for relevant account, store,
  offer, redemption, and system events, including read and read-all behavior.

### Administration, audit, and quality

- **REQ-019** Moderators/admins SHALL manage store and offer approval, rejection,
  suspension, and review notes according to role permissions.
- **REQ-020** Admins SHALL manage users, roles/status where permitted, dry-day
  calendar, age/legal settings, token expiry, supported launch settings, and
  maintenance/configuration controls.
- **REQ-021** Every authentication, authorization failure, moderation, config,
  inventory, offer, claim, expiry, and redemption event SHALL produce attributable,
  timestamped audit evidence with correlation context and minimized PII.
- **REQ-022** Admin analytics SHALL provide counts, trends, backlogs, and failure
  outcomes by supported geography and selectable time window.
- **REQ-023** All compatible existing API behavior and routes SHALL remain available
  or have an explicitly versioned/adapted equivalent with migration documentation.
- **REQ-024** Critical flows SHALL have contract/runtime evidence: auth, age gate,
  discovery, store/offer browsing, claim, QR redemption, replay rejection,
  dry-day blocking, moderation, and configuration.

## Non-Functional Requirements

- **NFR-001** User-visible discovery and wallet actions meet the current production
  baseline with no measured regression; loading states appear immediately.
- **NFR-002** Mobile and web surfaces meet WCAG 2.1 AA and support latest two major
  Chrome, Firefox, Safari, and Edge releases.
- **NFR-003** Sensitive data is minimized/masked, encrypted in transit, absent from
  logs, and protected by role and ownership boundaries.
- **NFR-004** Schema/data changes are additive and reversible until cutover; seed
  data is deterministic, non-production, and limited to Sohna/Gurugram.
- **NFR-005** Health/readiness, structured correlation-ID logs, metrics, and
  actionable user errors are available for release verification.

## Key Entities

User, session, OTP challenge, consent/age declaration, jurisdiction, city/pin code,
dry-day rule, category, brand, product, store, licence, store product/inventory,
offer, offer review, redemption token, redemption event, favorite, notification,
app configuration, audit log, and analytics snapshot.

## Assumptions and Decisions

- Launch geography means both named cities and their supported administrative
  jurisdiction; no other city is seed-published.
- Customers may browse only after age eligibility, while public health/configuration
  and authentication entry points remain available.
- Cashier is an authorized merchant/store role; physical ID verification remains an
  in-store operational responsibility and is never replaced by the app.
- Existing documented endpoints are the compatibility baseline; where names differ
  from the current docs, a compatibility adapter or versioned contract is required.
- Existing English/Hindi locales, MUI direction, mobile-first responsive behavior,
  and premium redesign defaults from clarification are accepted.

## Upstream Artifacts Consumed

- `H:\App\.github\modernize\rearchitecture\artifacts\constitution.md` — compliance,
  compatibility, geography, quality gates, and product exclusions.
- `H:\App\.github\modernize\rearchitecture\clarification.md` — resolved target
  platforms, authentication, migration, accessibility, and out-of-scope decisions.

## Evidence Mapping

- `constitution.md#Core Principles II–IV` → REQ-002–REQ-024 and redemption/admin
  acceptance scenarios.
- `constitution.md#Product and Regulatory Boundaries` → Scope Baseline,
  REQ-003, REQ-010–REQ-014, and NFR-004.
- `clarification.md#Frontend` → cross-platform, accessibility, localization, and
  responsive acceptance criteria.
- `clarification.md#Backend` → REQ-001, REQ-023, and additive fresh-schema assumption.

## Success Criteria

1. A test customer can authenticate, pass age/location gates, find a licensed
   Sohna/Gurugram store, claim an approved offer, and present a voucher in under
   five minutes on iOS, Android, and web.
2. 100% of attempted claims/redemptions outside geography, legal age, licence
   validity, offer validity, or dry-day policy are blocked server-side.
3. 100% of successful voucher tokens can be redeemed at most once; replay and
   concurrent duplicate attempts have no second financial/discount effect.
4. At least 95% of normal discovery and wallet interactions show a result within
   two seconds at the existing production baseline conditions.
5. Moderation, inventory, dry-day, configuration, and audit journeys are executable
   end-to-end with 0 unowned acceptance criteria and role isolation verified.
6. Keyboard/screen-reader/contrast checks find no critical WCAG 2.1 AA blocker on
   admin and web surfaces; equivalent semantic labels exist on mobile actions.
7. Full compatibility and critical-flow contract/runtime tests pass before cutover,
   with a documented rollback path for every changed boundary.

