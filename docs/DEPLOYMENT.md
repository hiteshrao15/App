# BottleBazaar Deployment & Infrastructure Guide

## 1. Local Development Stack (Docker Compose)
To start the infrastructure services (PostgreSQL + Redis + pgAdmin):
```bash
# Launch database & cache
npm run infra:up

# Run database migrations & seed initial stores and offers
npm run db:migrate
npm run db:seed

# Start backend API (Port 3000) & Admin Dashboard (Port 3001)
npm run dev
```

## 2. Cloud Deployment Target (Railway / Render / AWS)
- **Database**: Managed PostgreSQL 16 (AWS RDS or Supabase or Railway Postgres)
- **Cache**: Upstash Redis or AWS ElastiCache
- **API Service**: Containerized Node.js service using `Dockerfile`
- **Admin Dashboard**: Hosted on Cloudflare Pages, Vercel, or Netlify
- **Mobile Application**: Built via Expo EAS (`eas build -p android` and `eas build -p ios`)

### Running the mobile app on a real phone

`localhost` on a phone means the phone itself, not the computer running the API. Use the
computer's LAN IP address and keep the phone and computer on the same Wi-Fi network.

1. Start PostgreSQL and Redis, then start the API with `npm run dev:api`.
2. Find the computer's IPv4 address with `ipconfig` on Windows.
3. From `apps/mobile`, create a `.env` file containing:

```ini
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000/api/v1
```

Replace `192.168.1.25` with the computer's actual LAN IPv4 address. Do not use
`127.0.0.1` or `localhost` for a physical phone.

4. Start Expo for LAN access:

```bash
npm run dev:mobile -- --lan
```

5. Scan the Expo QR code with Expo Go. If the API is unreachable, allow Node.js
through Windows Firewall on private networks and verify that
`http://192.168.1.25:3000/health` opens from the phone's browser.

For an Android emulator, the default API address is `http://10.0.2.2:3000/api/v1`.
For an iOS simulator, the default is `http://localhost:3000/api/v1`.

## 3. Environment Variables Specification

### API Service (`services/api/.env`)
```ini
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bottlebazaar
REDIS_URL=redis://localhost:6379
JWT_SECRET=super_secret_bottlebazaar_jwt_signing_key_2026
JWT_REFRESH_SECRET=super_secret_refresh_key_bottlebazaar_2026
DEV_MOCK_OTP=true
```
