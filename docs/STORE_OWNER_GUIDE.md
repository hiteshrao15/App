# BottleBazaar Merchant & Store Owner Guide

## Overview for Retail License Holders
BottleBazaar brings high-intent adult patrons directly into your licensed physical retail premise through verified discount offers.

## 1. Accessing Your Merchant Terminal
1. Navigate to the Web Admin Portal at `http://localhost:3001`.
2. Sign in with your registered phone number or store manager email.
3. In the sidebar, select **"Redeem Coupons"**.

## 2. Validating Customer Vouchers at POS
1. When a patron presents their BottleBazaar voucher on their phone, observe the 6-character code (e.g. `BB-948123`) or scan their QR code.
2. Enter the code into the **In-Store Coupon Validator** box.
3. Enter the total pre-discount invoice bill amount.
4. Click **"Validate & Apply Discount"**.
5. The terminal instantly performs an atomic ledger check:
   - **Valid**: The system confirms the discount amount to deduct from the bill.
   - **Replay Attempt**: If the customer tries to use the same code twice or at multiple tills, the system immediately warns: *"Already Redeemed at [Timestamp]"*.

## 3. Statutory Reminders
- You MUST verify government photo ID (Aadhaar, Driving License, Passport) before handing over spirits.
- Never redeem vouchers on declared Dry Days. The platform automatically blocks redemptions on gazetted dry days.
