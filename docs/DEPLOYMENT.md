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

### Showing the mobile app on iOS and Android without publishing

You do not need an Apple Developer or Google Play Developer account to show
the app using Expo Go:

1. Install **Expo Go** from the App Store on the iPhone and from Google Play
   on the Android phone.
2. Start PostgreSQL, Redis, and the API:

```powershell
npm run infra:up
npm run db:migrate
npm run dev:api
```

3. Find the computer's private IPv4 address with `ipconfig`.
4. Set that address in `apps/mobile/.env`:

```ini
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000/api/v1
```

5. Start Expo from the repository root:

```powershell
npm run dev:mobile -- --lan --clear
```

6. Connect both phones and the computer to the same Wi-Fi, then scan the QR
   code with Expo Go. This works on iOS and Android without publishing to
   either store.

This LAN method is the most reliable no-account option. It will not work when
the client is on another network. A remote demonstration requires a temporary
HTTPS tunnel or hosted API, and tunnel services may require an account.

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
UPLOAD_DIR=uploads
```

### Render API build settings

The API TypeScript build requires the type packages listed in workspace
`devDependencies`, even when the runtime environment is production. Configure
the Render service with:

```text
Root Directory: .
Build Command: npm ci --include=dev && npm run build --workspace=services/api
Start Command: npm run start --workspace=services/api
Health Check Path: /health
```

Do not use `npm ci --omit=dev` or `npm install --production` as the build
command. Those commands remove `@types/express`, `@types/multer`, `@types/uuid`,
and TypeScript build dependencies before `tsc` runs.

The repository also contains a root `.npmrc` with `include=dev`, so the
existing `npm install && npm run build` command will install the TypeScript
build dependencies even when Render sets `NODE_ENV=production`. Trigger a new
deploy after pulling this change.

### Local file storage while R2 is unavailable

The API uses local disk storage for uploaded product and store images. Files
are written to `services/api/uploads` by default and served from
`/uploads/...`. This is suitable for a local client demonstration only: files
can be lost when a hosting service redeploys, and phones cannot reach files on
a developer laptop through the hosted Render API. Keep the API and phones on
the same LAN when using local uploads.

For a laptop-independent deployment, create a Supabase Storage bucket and set
these variables in the Render API environment:

```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
SUPABASE_STORAGE_BUCKET=bottlebazaar
SUPABASE_PUBLIC_BASE_URL=https://your-project.supabase.co/storage/v1/object/public/bottlebazaar
```

The bucket must allow public reads if product images are displayed directly
in the mobile app. Keep the service-role key only on Render; never put it in
the mobile app or commit it.

## Showing the app when the laptop is off

The permanent setup is:

1. Keep the API, PostgreSQL, and Redis on Render/Railway.
2. Configure Supabase Storage for persistent images.
3. Build an Android preview APK once and install it on the presentation phone.
4. On iPhone, use Expo Go with a hosted Expo project or later create an iOS
   distribution build. An iOS standalone install requires Apple signing.

Expo Go using a LAN QR code is only a development demonstration and requires
the laptop to remain on. An Android APK does not require the laptop after
installation, but creating the APK with EAS requires an Expo account.
