# Cross-Platform Voucher Information Architecture

Preserve existing mobile tab identifiers while making Wallet and voucher presentation a first-class, counter-ready flow.

## What Happened

For BottleBazaar t6, the customer experience was specified around a legal-age and
city gate, discovery, a single-use offer claim, and in-store QR presentation. The
existing tabs (`home`, `discover`, `offers`, `favorites`, `account`, `wallet`) are
kept as compatible deep-link targets, while the phone bottom bar prioritizes Wallet
and the web rail exposes the same destinations. Payment, delivery, and online
redemption were intentionally excluded.

## Takeaway

For future UX work on regulated voucher products, define the token presentation,
failure reason taxonomy, and role-specific counter flow alongside normal screens.
Preserving route IDs avoids invisible navigation regressions during a visual
redesign.

## History

- 2026-10-25 (BottleBazaar/t6): initial
