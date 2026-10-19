# 🍾 BottleBazaar — India's Premier Spirits Discovery & In-Store Discount Marketplace

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-red.svg)](https://redis.io/)
[![React Native / Expo](https://img.shields.io/badge/React%20Native-Expo%2051-black.svg)](https://expo.dev/)
[![License: FSSAI / State Excise](https://img.shields.io/badge/Compliance-Indian%20State%20Excise-amber.svg)](#legal--regulatory-compliance)

**BottleBazaar** is a production-oriented cross-platform liquor discovery, store locator, and verified in-store discount coupon marketplace designed specifically for the legal and regulatory framework of India.

---

## ⚖️ Legal & Regulatory Compliance Architecture

Unlike conventional marketplaces, alcohol retail in India is governed by strict state excise laws. BottleBazaar has been built from the ground up with the following statutory safeguards:

1. **Strictly In-Store Redemption (No Online Sale or Home Delivery)**:
   - In India, direct home delivery of liquor is restricted in most states.
   - BottleBazaar does NOT handle payment processing for liquor purchases.
   - Instead, customers discover authorized retailers and claim **time-limited, single-use promotional vouchers** that are verified physically across the retail checkout counter.
2. **State-Specific Legal Drinking Age (LDA) Engine**:
   - **Maharashtra & Delhi**: Mandatory **25+** self-declaration before browsing spirits discounts.
   - **Goa & Karnataka**: Mandatory **21+** self-declaration.
   - Self-declared age is stored with immutable timestamp records. Cashiers verify physical government photo ID prior to billing.
3. **Automated Excise Dry Days Lock**:
   - On gazetted national holidays (Republic Day, Independence Day, Gandhi Jayanti) and state-specific dry days, the platform automatically halts voucher redemptions for affected locations.
4. **Excise License Transparency**:
   - Every participating store displays its statutory excise license number and expiry date.
5. **Responsible Drinking Helpline**:
   - Built-in one-tap access to the National Alcohol Support Helpline (`1800-11-0031`) and mandatory statutory warnings.

---

## 🏛️ Monorepo Architecture

```
bottlebazaar/
├── apps/
│   ├── admin/             # React + Vite web dashboard & cashier redemption terminal
│   └── mobile/            # React Native / Expo cross-platform iOS & Android mobile app
├── packages/
│   └── types/             # Shared TypeScript domain definitions
├── services/
│   └── api/               # Express + PostgreSQL + Redis backend API & OpenAPI documentation
├── infra/
│   └── docker-compose.yml # PostgreSQL 16, Redis 7, and pgAdmin containers
└── docs/                  # Comprehensive technical documentation & runbooks
```

---

## 🚀 Quick Start Guide (Beginner Friendly)

### Prerequisites
- **Node.js**: v20 or newer (`node -v`)
- **Docker Desktop**: Running locally (`docker --version`)

### Step 1: Clone and Install Dependencies
```bash
git clone https://github.com/bottlebazaar/bottlebazaar.git
cd bottlebazaar

# Install all monorepo dependencies
npm install
```

### Step 2: Launch Database & Cache
```bash
npm run infra:up
```
*This starts PostgreSQL 16 on port `5432` and Redis 7 on port `6379`.*

### Step 3: Run Database Migrations & Seeds
```bash
npm run db:migrate
npm run db:seed
```
*Populates verified licensed stores in Mumbai, Bengaluru, Delhi, and Panaji along with active introductory discount offers.*

### Step 4: Start Backend API & Admin Web Dashboard
```bash
npm run dev
```
- **Backend API**: Accessible at [http://localhost:3000](http://localhost:3000)
- **Interactive Swagger Docs**: Accessible at [http://localhost:3000/docs](http://localhost:3000/docs)
- **Admin & Merchant Portal**: Accessible at [http://localhost:3001](http://localhost:3001)

### Step 5: Launch Mobile App (Expo)
In a separate terminal:
```bash
npm run dev:mobile
```
*Press `w` in terminal to run in web browser, or scan the QR code with the Expo Go app on your iOS/Android phone.*

---

## 🎟️ Testing In-Store Coupon Redemption Flow

1. Open the **Mobile App** (or web preview via `npm run dev:mobile`).
2. Accept the **Age Gate** by confirming you are 25+ (in Maharashtra/Delhi) or 21+ (in Karnataka/Goa).
3. On the **Deals** screen, tap **"Claim In-Store Coupon"** on any offer.
4. An active coupon with a code (e.g. `BB-948123`) and QR code will appear in your **Wallet**.
5. Open the **Admin / Merchant Terminal** at [http://localhost:3001](http://localhost:3001) and navigate to **"Redeem Coupons"**.
6. Enter `BB-948123` and bill amount `₹4500`.
7. Click **"Validate & Apply Discount"** — the discount is instantly applied and recorded to the immutable ledger.
8. Trying to redeem the same code a second time triggers an immediate **Replay Alert**.

---

## 🧪 Automated Testing
```bash
# Run unit & integration test suites
npm run test
```

---

## 📚 Technical Documentation Index

- [Architecture Design & Mermaid Charts](docs/ARCHITECTURE.md)
- [Feature Matrix & Legal Compliance](docs/FEATURES.md)
- [Customer User Guide](docs/USER_GUIDE.md)
- [Store Owner & Merchant POS Guide](docs/STORE_OWNER_GUIDE.md)
- [REST API Specifications](docs/API.md)
- [Database Schema & ER Diagrams](docs/DATABASE.md)
- [Security Controls & Anti-Fraud](docs/SECURITY.md)
- [Deployment & Cloud Configuration](docs/DEPLOYMENT.md)
- [Automated Testing Runbook](docs/TESTING.md)

---

## 🛡️ License & Statutory Disclaimer
BottleBazaar is built strictly for authorized adult consumers and licensed retail merchants. Alcohol consumption is injurious to health. Be safe — never drink and drive.
