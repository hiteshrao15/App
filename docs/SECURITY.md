# BottleBazaar Security Architecture & Compliance

## Security Principles

### 1. Replay & Double-Redemption Protection
Coupons are prone to fraud if presented multiple times or cloned across screens.
- Every claim generates a cryptographically random token (`BB-XXXXXX`) stored in Postgres with status `CLAIMED` and an expiration timestamp (30 minutes).
- Upon redemption at the store counter, the validation is executed inside a PostgreSQL serializable transaction and guarded by a Redis mutex lock (`SET token_lock EX 10 NX`).
- Once redeemed, status shifts atomically to `REDEEMED`, with the cashier ID and invoice amount recorded. Any second attempt is refused with a replay alert.

### 2. Multi-Tier Rate Limiting
- **OTP Send Limits**: Maximum 3 requests per phone number per hour to prevent SMS cost exhaustion and brute force abuse.
- **Redemption Claims**: Maximum 5 coupon claims per user per 24 hours.
- **Search & Public APIs**: 60 requests per minute per IP via `express-rate-limit` backed by Redis counters.

### 3. Data Protection & Privacy
- Zero credit card or banking details stored (transactions are cash/POS card processed directly at retail stores).
- Customer phone numbers are masked in merchant ledger views (`+91 98*** ***45`).
- Helmet HTTP security headers (CSP, HSTS, X-Frame-Options) enabled on API and Admin web applications.
