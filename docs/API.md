# BottleBazaar API Reference

Base URL: `http://localhost:3000/api`  
Interactive Swagger Docs: `http://localhost:3000/docs`

## Authentication Headers
All protected endpoints require a Bearer token:
```http
Authorization: Bearer <jwt_access_token>
```

---

## Key Endpoints

### 1. Authentication (`/auth`)
- `POST /auth/otp/send` — Request 6-digit SMS OTP
  - Body: `{ "phoneNumber": "+919820012345" }`
- `POST /auth/otp/verify` — Verify OTP & receive JWT token pair
  - Body: `{ "phoneNumber": "+919820012345", "otp": "123456" }`
- `POST /auth/refresh` — Refresh access token
- `POST /auth/logout` — Revoke and blacklist current session in Redis

### 2. Stores (`/stores`)
- `GET /stores` — List verified liquor retailers with distance calculations
  - Query parameters: `lat`, `lng`, `city`, `state`, `radiusKm`, `page`, `limit`
- `GET /stores/:id` — Detailed store view with active promotional deals
- `POST /stores` — Register new store (Store Owner / Admin only)

### 3. Offers (`/offers`)
- `GET /offers` — Query marketplace deals
  - Query parameters: `category`, `discountType`, `storeId`, `active`
- `GET /offers/:id` — Offer terms and discount rules
- `POST /offers` — Create promotional campaign (Store Owner / Admin only)

### 4. Redemptions (`/redemptions`)
- `POST /redemptions/claim` — Customer claims a time-limited voucher token
  - Body: `{ "offerId": "uuid" }`
  - Response: `{ "tokenCode": "BB-948123", "expiresAt": "2026-10-19T11:45:00Z" }`
- `POST /redemptions/verify` — Merchant POS validates voucher code
  - Body: `{ "tokenCode": "BB-948123", "billAmount": 4500 }`
  - Response: `{ "verified": true, "discountAmount": 675 }`

### 5. Health & Monitoring (`/health`)
- `GET /health` — Health check endpoint verifying PostgreSQL pool and Redis connectivity
