# BottleBazaar Feature Inventory & Status Matrix

| Module | Feature | Implementation Status | Regulatory Compliance |
| :--- | :--- | :--- | :--- |
| **Legal & Age Gate** | State-specific Legal Drinking Age enforcement (21 / 25) | Complete | State Excise Acts (MH, DL, KA, GA) |
| **Legal & Age Gate** | Mandatory statutory health warnings | Complete | FSSAI & Cigarettes/Tobacco/Liquor Ads Code |
| **Legal & Age Gate** | Dry Days auto-lock per state jurisdiction | Complete | National & State Gazette Orders |
| **Authentication** | Mobile phone OTP verification (SMS + Dev Bypass) | Complete | Anti-Spam TRAI Guidelines |
| **Authentication** | JWT session rotation & blacklisting via Redis | Complete | OWASP ASVS 4.0 |
| **Store Locator** | Geolocation distance calculation & nearest shops | Complete | Licensed retail premises only |
| **Store Locator** | State Excise License Number & validity display | Complete | Public excise transparency |
| **Offers & Discounts**| In-store Percentage, Flat, and BOGO campaigns | Complete | Below-MRP discount protection |
| **Redemption** | Single-use time-limited QR and alphanumeric coupon | Complete | Replay protection via Redis SETNX |
| **Merchant POS** | Cashier verification terminal with real-time audit | Complete | Prevents offline voucher fabrication |
| **Admin Portal** | Store approvals, offer approvals, and system controls | Complete | Role-Based Access Control (RBAC) |
| **Database** | PostgreSQL 16 schema with PostGIS & audit trails | Complete | ACID transaction isolation |
