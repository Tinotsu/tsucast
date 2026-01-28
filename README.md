# tsucast

> Turn any article into a podcast in under 10 seconds.

tsucast is a mobile app that converts web articles into high-quality audio using AI text-to-speech. Paste a URL, pick a voice, and listen.

## Features

- **Instant conversion** - Paste any URL, hear audio in <10 seconds
- **Premium voices** - Natural-sounding AI voices via Kokoro TTS
- **Background playback** - Listen while using other apps
- **Personal library** - Save and organize your audio articles
- **Cross-device sync** - Your library follows you everywhere
- **Offline support** - Download for listening without internet

## Tech Stack

| Component | Technology |
|-----------|------------|
| Mobile App | Expo SDK 54 + React Native |
| Styling | NativeWind v4 (Tailwind CSS) |
| Navigation | expo-router v6 |
| Auth & Database | Supabase |
| API Server | Node.js + Hono |
| Text-to-Speech | Kokoro TTS |
| Audio Storage | Cloudflare R2 |
| Payments | RevenueCat |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tsucast.git
cd tsucast

# Install dependencies
npm install

# Set up environment variables
cp apps/mobile/.env.example apps/mobile/.env
# Edit .env with your Supabase credentials
```

### Development

```bash
# Start the mobile app
npm run mobile

# Start the API server (separate terminal)
npm run api
```

### Project Structure

```
tsucast/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── api/             # Hono API server
├── packages/
│   └── shared/          # Shared types and utilities
├── supabase/
│   └── migrations/      # Database migrations
└── _bmad-output/        # Planning documents
```

## Environment Variables

### Mobile App (`apps/mobile/.env`)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=https://api.tsucast.com
```

### API Server (`apps/api/.env`)

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
KOKORO_API_URL=xxx
KOKORO_API_KEY=xxx
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=tsucast-audio
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run mobile` | Start Expo development server |
| `npm run api` | Start API server in development |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run ESLint |

## CI/CD

- **CI**: Runs on every push/PR - lints, typechecks, builds
- **Migrations**: Auto-run when `supabase/migrations/*` changes
- **API Deploy**: Railway auto-deploys when `apps/api/*` changes, GitHub Actions runs smoke test

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │────▶│   Railway   │────▶│  Supabase   │
│     App     │     │  (Hono API) │     │  (Auth+DB)  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │Kokoro TTS │    │    R2     │    │RevenueCat │
   │   (TTS)   │    │ (Storage) │    │ (Payments)│
   └───────────┘    └───────────┘    └───────────┘
```

## Contributing

This is a private project. See `_bmad-output/` for planning documents and sprint status.

## License

Proprietary - All rights reserved.
