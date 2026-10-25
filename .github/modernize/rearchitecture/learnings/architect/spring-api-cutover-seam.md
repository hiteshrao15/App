# Spring API Cutover Seam

BottleBazaar's Java/Spring rewrite must preserve the `/api/v1` REST boundary while clients remain frozen consumers.

## What Happened
Task t3 found the current Express app mounts all client-facing routes from `services/api/src/app.ts`, while Expo and admin clients call those paths directly. The architecture artifacts therefore model a declared seam with explicit DTO/property/status mapping and a phased migration boundary.

## Takeaway
Treat existing route paths, camelCase response fields, role/error statuses, paise integers, hashed token semantics and Redis key prefixes as compatibility contracts until client probes pass. The old Express source may remain during rollback, but it is not the target runtime.

## History
- 2026-10-25 (BottleBazaar/t3): initial
