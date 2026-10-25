# t6 - BottleBazaar Cross-Platform UX Specification

## Summary

BottleBazaar is a discovery and in-store voucher experience, not an ecommerce or
delivery product. The primary customer path is: authenticate, choose a supported
city, pass the legal-age gate, discover a licensed store or offer, claim a
single-use voucher, and present it at that store counter. The same information
architecture is shared by Expo iOS/Android/web; the admin web app uses a separate
role-aware workspace for merchant, cashier, moderator, and administrator tasks.

## Upstream Artifacts Consumed

- `H:\App\.github\modernize\rearchitecture\artifacts\spec.md` - actor journeys,
  functional requirements REQ-001 through REQ-024, cross-cutting states, and
  accessibility/non-functional requirements.
- `H:\App\.github\modernize\rearchitecture\artifacts\constitution.md` - product
  boundaries, WCAG 2.1 AA release gate, compatibility requirement, and no-payment/
  no-delivery constraints.

## Evidence Mapping

- `spec.md#Customer journeys` scenarios 1-6 -> customer navigation, auth, age/city
  gate, discovery, offer claim, Wallet, and profile flows below.
- `spec.md#Merchant journeys` scenarios 7-11 -> merchant workspace, cashier
  redemption, inventory, offer authoring, and analytics flows below.
- `spec.md#Moderator and administrator journeys` scenarios 12-15 -> moderation,
  compliance, audit, user management, and analytics workspace below.
- `spec.md#Cross-cutting states and accessibility` and `NFR-001/NFR-002` ->
  state model, responsive rules, and accessibility acceptance criteria below.
- `constitution.md#Product and Regulatory Boundaries` -> explicit exclusion of
  payment, delivery, online sale, and online redemption actions.

## Experience Principles

1. **Trust before conversion:** verified licence, store distance/address, offer
   terms, expiry, and statutory warning are visible before a claim action.
2. **One clear next action:** each screen has one primary CTA; destructive or
   irreversible actions require confirmation and explain consequences.
3. **Local and bilingual:** Sohna and Gurugram are first-class choices; English
   and Hindi can be switched from onboarding and Account, with language retained
   across sessions. Compliance copy and warnings are never omitted in translation.
4. **Counter-ready:** Wallet is optimized for a cashier handoff, with a large QR,
   readable fallback code, store name, expiry, and “show at this store” guidance.
5. **No implied ecommerce:** do not show cart, checkout, delivery, shipping, or
   payment affordances anywhere in customer or merchant flows.

## Customer Information Architecture

### Primary navigation

The existing compatible tab identifiers remain available: `home`, `discover`,
`offers`, `favorites`, `account`, and `wallet`. On phones, use a five-item bottom
bar (`Home`, `Discover`, `Wallet`, `Offers`, `Account`) and expose Favorites from
the Discover header and Account. On web, use a left rail with the same labels and
keep Wallet as a persistent high-visibility action in the top bar. Deep links to
existing routes resolve to the equivalent tab and retain back navigation.

### Screen inventory and behavior

| Surface | Required content | Primary action and behavior |
|---|---|---|
| Welcome/Auth | Brand, statutory boundary (“in-store only”), Sign up, Log in, language, help | Phone OTP and email/password are separate selectable methods; never display OTP/password in logs or support copy |
| OTP verification | Masked phone, six input cells, countdown, resend, change number, error region | Auto-advance cells, paste support, one retry path; lockout explains wait time without revealing account existence |
| Email auth | Email, password, confirm password on sign-up, forgot password | Inline validation; password visibility toggle; submit disabled only while invalid/submitting |
| City and age gate | Sohna/Gurugram cards, configured age threshold, declaration text, policy version, statutory warning | City and age must be selected before Continue; under-age/unsupported city is blocked with helpline and change-selection action |
| Home | Selected city, search, featured approved offers, nearby/verified stores, warning banner, Wallet shortcut | Cards show validity and store context; pull-to-refresh/mobile refresh and retry on API failure |
| Discover | Search with suggestions, segmented Stores/Products, filter sheet/panel, paged results | Filters persist when navigating detail and back; empty state offers clear-filter and change-city actions |
| Store detail | Verified badge, licence number/valid-to (not private evidence), address, hours, contact/directions, stock availability, offers, products | Favorite toggle has an accessible pressed state; directions open device map only, never checkout |
| Product detail | Image/fallback, brand/category, pack/ABV when available, description, price context, stock state, stores, offers | Offer/store links preserve search context; unavailable stock is informational and not an order CTA |
| Offer detail | Discount type/value, terms, dates, per-customer/minimum bill limits, eligible products/store, stock caveat, warning | Claim button is disabled with reason when ineligible; confirmation sheet summarizes all constraints before issuing token |
| Claim result | Success confirmation, store, offer, expiry countdown, “View in Wallet” | Token is issued once; duplicate/exhausted/dry-day/error response stays on page with actionable reason and no token |
| Wallet list/detail | Active first, then redeemed/expired/cancelled history; status chips and expiry | Active voucher opens full-screen presentation; expired history remains understandable but cannot be presented as usable |
| Voucher presentation | Large QR, high-contrast fallback code, store/offer/expiry, “show cashier”, in-store-only and ID reminder | Brightness-friendly layout, prevent accidental claim/redeem controls; refresh only re-fetches status |
| Favorites | Stores/products grouped with stable empty state | Remove with undo toast; unavailable content is labeled and links to current detail when still public |
| Notifications | Unread/read grouping, read-all, event type and timestamp | Notification links land in the relevant detail; no sensitive token in notification text |
| Account | Profile, city/age consent status, language, notification preferences, help/helpline, delete/logout | Age consent is viewable but not silently changed; deletion and logout use confirmation |

### Customer state rules

- Show skeletons immediately for home/list/detail. Preserve prior content while
  refreshing and announce refresh completion to screen readers.
- Empty, offline, not-found, expired-session, unauthorized, maintenance, and
  validation states each include a plain-language title, next step, and retry/back
  action. Offline states must not imply that a voucher can be redeemed.
- A session expiry returns to Auth while retaining a non-sensitive deep-link target.
- A dry-day or policy block explains that the platform is unavailable for the
  selected jurisdiction/date; do not expose internal rule IDs.

## Merchant, Cashier, Moderator, and Admin IA

The admin web shell uses a persistent role-filtered rail, global location selector,
date range, notification center, and profile menu. Navigation is hidden rather than
merely disabled when a role lacks permission; direct links return a 403 page with a
safe explanation.

### Merchant and cashier workspace

- **Overview:** owned-store KPIs (active offers, stock alerts, claims/redemptions,
  failures) with date/store filters and links to the source list.
- **Stores:** list with status (`Draft`, `Pending review`, `Approved`, `Rejected`,
  `Suspended`, `Licence expired`); create/edit wizard for identity, Sohna/Gurugram
  address, hours, contact, licence metadata/evidence. Submit shows a review summary.
- **Inventory:** table/grid with search, category, stock flag, stock note, price,
  last updated, bulk-safe edit, and audit confirmation. No customer private data.
- **Offers:** draft editor for percentage/fixed/custom terms, product/store scope,
  dates, limits, minimum bill, and terms; preview exactly matches customer card.
  Submitting changes status to pending review and locks published fields until a
  revision is made.
- **Redeem:** cashier-first screen with QR scanner permission explanation,
  fallback-code input, bill amount, store context, and explicit identity/physical
  ID reminder. Confirmation shows calculated discount before final submit. Success
  shows a receipt-like event ID; invalid, wrong-store, expired, redeemed,
  dry-day, and unauthorized outcomes have distinct text and no ambiguous retry.
- **Analytics:** charts plus accessible tabular equivalent for inventory,
  claims/redemptions, discount value, expiry/rejection trends; filters are scoped
  to authorized stores and export excludes token secrets and excess PII.

### Moderator and administrator workspace

- **Review queue:** pending stores/offers with age, location, submitter, licence
  validity, terms, and evidence summary. Approve, reject-with-reason, suspend, and
  reinstate actions require a confirmation dialog and reason where applicable.
- **Users and roles:** searchable masked-PII list, status, role, last activity,
  suspend/restore with confirmation and audit reason.
- **Compliance:** dry-day calendar by jurisdiction, legal-age and statutory copy,
  token expiry, supported launch cities, and maintenance mode. Show effective
  date/time and an impact warning before save.
- **Audit:** immutable timeline with actor, target, action, outcome, timestamp,
  correlation ID, and masked values; filters persist through pagination.
- **Platform analytics:** customer/store/offer counts, backlog, active inventory,
  claims, redemption outcomes/failures, and geography/date trends. Every chart has
  a table view and an accessible empty/no-data state.

## Visual and Interaction System

Use a premium, calm “night market” visual language: dark ink surfaces, warm amber
accent for actions, and a restrained teal success color. Never use color alone for
status; pair every status with text/icon. Keep a 4px base spacing scale, 12px card
radius, 44px minimum touch target (48px preferred on mobile), and 16px minimum body
text where platform defaults allow. Use one display style for headings and a highly
legible sans-serif for body/UI; avoid condensed text for legal copy.

Design tokens should be shared across Expo and admin:

- **Semantic colors:** `surface`, `surfaceElevated`, `textPrimary`, `textMuted`,
  `accent`, `success`, `warning`, `danger`, `focus`; test normal text at 4.5:1
  and large text at 3:1 minimum.
- **Status treatment:** label + icon + color (`Approved`, `Pending review`,
  `Expired`, `Blocked`, `Redeemed`); status chips must remain understandable in
  grayscale.
- **Motion:** short, interruptible transitions only; honor reduced-motion settings.
  Never use animation as the only indication of loading or success.

## Responsive and Platform Rules

- **Phone (0-599px):** one-column cards, bottom tabs, filter bottom sheet, sticky
  primary action above the safe-area inset, and full-screen voucher presentation.
- **Tablet (600-1023px):** two-column discovery/detail where practical, rail may
  collapse, scanner and voucher can sit side-by-side.
- **Desktop web (1024px+):** max content width 1280px, persistent rail, split
  list/detail, filter panel on the left and results on the right, sticky table
  headers, and modal dialogs constrained to 560px.
- iOS/Android back gestures and hardware back return to the previous screen without
  losing filters. Web browser back and refresh preserve city, language, and safe
  search/filter state in the URL; never persist tokens or sensitive form values.
- QR scanning requests camera access only at the cashier action, explains why, and
  provides fallback code entry. Denied permission must not trap the cashier.

## Accessibility and Localization Acceptance Criteria

1. Every input has a visible label, programmatic label, error association, and
   autocomplete/input mode; OTP cells announce position and support keyboard paste.
2. Focus order follows visual order. Dialogs trap focus, announce title/error,
   close on Escape/web back, and return focus to the trigger. Focus indicator is
   visible against all surfaces.
3. Dynamic status/error/toast messages use an appropriate live region without
   stealing focus. QR fallback code is selectable and read correctly by a screen
   reader; the QR has an equivalent text label.
4. Touch targets are at least 44x44 CSS points, text scales to 200% on web without
   clipping, and web keyboard operation covers filters, tables, tabs, and scanner
   fallback. Do not rely on hover.
5. Hindi strings accommodate longer text and Devanagari line height. Locale changes
   update labels, date/time, number formatting, and direction where required while
   statutory/legal meaning remains intact.
6. Test latest two major Chrome, Firefox, Safari, and Edge versions plus VoiceOver,
   TalkBack, and keyboard-only admin flows. Include reduced motion and high text
   scaling in smoke coverage.

## API and Frontend Contract Implications

Frontend requires paginated, filterable endpoints that return stable IDs, labels,
status/reason codes, `updatedAt`, and `nextCursor`/page metadata for stores,
products, offers, favorites, wallet, notifications, moderation, inventory, and
analytics. Offer/detail payloads must include terms, validity, store/city, licence
display status, and eligibility reason when claim is unavailable. Claim responses
must return an opaque token presentation payload only on success; redemption errors
must expose the distinct outcomes in REQ-013 without sensitive internals. Public
configuration must provide supported cities, legal-age policy/version, warning,
helpline, maintenance state, and locale strings. Existing route names and tab deep
links remain supported through adapters or explicit versioning per REQ-023.

## Verification Checklist

- [ ] New customer can complete auth -> city/age gate -> discovery -> offer claim ->
      Wallet QR in under five minutes on iOS, Android, and web.
- [ ] Customer can recover from invalid OTP, expired session, offline API, empty
      results, expired voucher, dry-day block, and wrong-store information.
- [ ] Merchant can submit a store/licence, manage inventory, author an offer, and
      redeem by QR or fallback code exactly once.
- [ ] Moderator/admin can approve/reject/suspend content, configure dry days and
      age settings, inspect masked audit events, and view analytics.
- [ ] No customer surface exposes payment, delivery, cart, online alcohol sale, or
      online redemption actions.
- [ ] Automated accessibility checks plus manual keyboard/screen-reader checks pass
      for customer web and all admin routes; mobile actions have semantic labels.

## Test Results

- Command: documentation inspection (`Get-ChildItem`, `rg`, and artifact review)
- Passed: 1 (UX specification completeness review)
- Failed: 0
- Skipped: 0

