# BottleBazaar Automated Testing & Verification Guide

## Test Suite Architecture
The test suite covers:
1. **Authentication Tests** (`services/api/src/__tests__/auth.test.ts`):
   - Phone OTP generation
   - JWT token issuance & claim verification
   - Rate limiting on OTP send attempts
   - Session revocation & blacklisting in Redis
2. **Redemption Tests** (`services/api/src/__tests__/redemptions.test.ts`):
   - Legal drinking age compliance gate
   - Single-use voucher claiming & time expiration
   - Anti-replay prevention under concurrent requests
   - Role-Based Access Control (RBAC) preventing unauthorized redemption

## Running Tests

To run the complete automated test suite:
```bash
# Run tests across all workspaces
npm run test

# Run tests specifically in API service
cd services/api
npm test
```
