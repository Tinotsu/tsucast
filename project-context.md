# tsucast - Project Context

> Critical rules and patterns for AI agents implementing code in this project.

## Project Overview

**tsucast** converts any web article into a podcast using AI text-to-speech. Users paste a URL, select a voice, and receive streamable audio in under 10 seconds.

**Target:** 1,000 paid subscribers in 3 months (YC goal)

## MANDATORY: Before ANY Code Task

**This applies to ALL work - implementation, bug fixes, refactoring, testing, reviews.**

### Step 1: Run the app FIRST
```bash
npm run mobile
```
- Wait for the app to bundle and load
- Read ALL console warnings - **do not ignore them**
- **STOP and fix any deprecation warnings immediately** before doing anything else
- Common deprecations to watch for:
  - `SafeAreaView` → use `react-native-safe-area-context`
  - Deprecated props, APIs, or imports
- Only proceed when console shows zero warnings

### Step 2: Do your task
- Implement, fix, refactor, or test as required

### Step 3: Run the app AGAIN after changes
```bash
npm run mobile
```
- Verify no new warnings introduced
- Check that your changes work correctly
- Fix any issues before considering the task complete

**NEVER skip these steps. NEVER trust that previous work is complete without verifying.**

## Tech Stack & Versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | >=20 (API), >=18 (root) |
| Language | TypeScript (strict mode) | 5.9 (mobile), 5.4+ (api), 5.7+ (web) |
| React | React | 19.1.0 (all workspaces) |
| Mobile | Expo SDK 54, React Native | `expo ~54.0.31`, `react-native 0.81.5` |
| Mobile Navigation | expo-router v6 | `expo-router ~6.0.22` |
| Web | Next.js 15 (App Router) | `next 15.5.9` |
| API Server | Hono v4 on Node.js (Hetzner VPS) | `hono ^4.4.0` |
| Styling (mobile) | NativeWind v4 + Tailwind v3 | `nativewind ^4.1.23`, `tailwindcss ^3.4.4` |
| Styling (web) | Tailwind CSS v4 | `tailwindcss ^4.0.0` |
| Server State | TanStack React Query v5 | `@tanstack/react-query ^5.51.0` |
| Client State | Zustand v4 | `zustand ^4.5.4` |
| Audio | react-native-track-player v4 + expo-av | `react-native-track-player ^4.1.2` |
| Auth | Supabase Auth | `@supabase/supabase-js ^2.45.0` |
| Database | Supabase PostgreSQL | via Supabase JS client |
| Storage | Cloudflare R2 | `@aws-sdk/client-s3 ^3.600.0` |
| TTS | Fish Audio API | via API server |
| Payments | RevenueCat + Stripe | `react-native-purchases ^9.7.1`, `stripe ^20.2.0` |
| Validation (API) | Zod | `zod ^3.23.0` |
| Logging (API) | Pino | `pino ^9.2.0` |
| Testing (mobile) | Jest | `jest ^29.7.0` |
| Testing (api/web) | Vitest | `vitest ^3.0.4` |
| E2E (web) | Playwright | `@playwright/test ^1.50.0` |
| Deploy (web) | Cloudflare Pages via OpenNext | `@opennextjs/cloudflare ^1.0.0` |

**Version constraints:** Mobile uses Tailwind v3 (NativeWind v4 requirement), web uses Tailwind v4. React 19.1.0 is enforced via root `overrides`.

## Project Structure

```
tsucast/
├── apps/
│   ├── mobile/          # Expo React Native app (PRIMARY)
│   │   ├── app/         # expo-router pages
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API clients
│   │   └── stores/      # Zustand stores
│   ├── web/             # Next.js web app (SECONDARY - testing/marketing/admin)
│   │   ├── app/         # App Router pages
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities
│   └── api/             # Hono API server
│       └── src/
│           ├── routes/  # API endpoints
│           ├── services/# Business logic
│           └── middleware/
├── packages/
│   └── shared/          # Shared types/utils
├── supabase/
│   └── migrations/      # Database migrations
└── _bmad-output/        # Planning artifacts
```

## Language-Specific Rules

### TypeScript Configuration
- Strict mode enabled in all workspaces — no implicit `any`, strict null checks
- Mobile: `moduleResolution: "bundler"`, `@/*` maps to `./*` (project root-relative)
- API: `moduleResolution: "bundler"`, `@/*` maps to `./src/*`
- API is ESM (`"type": "module"`) — **relative imports require `.js` extension** (e.g., `import { logger } from '../lib/logger.js'`)
- Mobile imports need no file extension (e.g., `import { cn } from '@/utils/cn'`)

### Import Conventions
- Use `@/` path alias for all internal imports (never `../../..` deep relative paths)
- API: use relative imports within same module, `@/` for cross-module
- Use dynamic `await import()` to break circular dependencies (see `services/api.ts`)
- External npm packages use bare specifiers

### Error Handling
- API routes **never throw** — always return `c.json({ error: { code, message } }, statusCode)`
- Use centralized `ErrorCodes` constant and `createApiError()` from `src/utils/errors.ts`
- Mobile service functions throw errors; React Query `onError` handles them
- Pino logger auto-redacts: `authorization`, `token`, `password`, `api_key`, `secret`

### Type Conventions
- `any` triggers ESLint warning — requires comment justification if suppressed
- Unused function params: prefix with `_` (e.g., `_event`)
- Use `interface` for component props, `type` for unions/utility types
- Zod schemas for all API input validation on the server side

## Framework-Specific Rules

### React / React Native (Mobile)
- Functional components only with typed props interfaces — no class components
- Hooks encapsulate all business logic; components are thin UI wrappers
- `useAuth()` manages auth state with `useState` + `useEffect` + Supabase `onAuthStateChange` listener — not React Query
- All other server data uses React Query (`useQuery`/`useMutation`)
- Player state lives in Zustand (`usePlayerStore`) — it is client-only state, not server state
- Use `cn()` utility (clsx + tailwind-merge) from `@/utils/cn` for conditional class merging
- Feature directories have barrel exports via `index.ts` (e.g., `components/player/index.ts`)

### Expo Router
- File-based routing in `apps/mobile/app/`
- Layout groups: `(tabs)` for main nav, `(auth)` for unauthenticated screens
- Dynamic routes: `player/[id].tsx`, `playlist/[id].tsx`
- Root `_layout.tsx` handles auth gate — redirects to login if no session

### Hono (API Server)
- Each route file creates `new Hono()` and exports as default
- Routes mounted in `src/index.ts`: `app.route('/api/generate', generateRoutes)`
- Auth via `getUserFromToken()` helper or `requireAuth` middleware — not Hono's built-in auth
- Zod validates request body/query inside route handlers
- Global middleware order: CORS → logger → logging → timeout (120s) → body limit (1MB)

### Rate Limiting
Two independent rate limiting layers protect the API:

- **User-based** (`services/rate-limit.ts`): Free tier daily generation limit tracked in `user_profiles.daily_generations`. Pro users unlimited. Counter resets at midnight UTC (`daily_generations_reset_at`). Checked before each generation.
- **IP-based** (`middleware/ip-rate-limit.ts`): In-memory sliding window — 60 requests per 60 seconds by default. LRU eviction at 10k entries (~1 MB cap). Returns `429` with `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` headers. **Single-process only** — needs Redis for multi-instance deployments.

### NativeWind (Mobile Styling)
- Tailwind classes via `className` prop on RN components
- Inline `style` prop only for dynamic computed values (e.g., `style={{ width: buttonSize }}`)
- No `StyleSheet.create()` — NativeWind classes for all static styles

### Next.js (Web)
- App Router with server components by default
- Supabase SSR via `@supabase/ssr`
- Deployed to Cloudflare Pages via `@opennextjs/cloudflare`

## Testing Rules

### Frameworks & Commands
- Mobile: Jest — `npm run test:mobile`
- API: Vitest — `npm run test:api` (excludes E2E)
- API E2E: Vitest with 30s timeout — `npm run test:e2e`
- Web: Vitest — `npm run test:web`
- All: `npm run test` (all workspaces), `npm run typecheck` (all workspaces)

### Test Organization
- Tests live in `__tests__/` directories — **not** co-located next to source files
- Mobile: `apps/mobile/__tests__/unit/{domain}/{name}.test.ts`
- API: `apps/api/__tests__/integration/{name}.test.ts`
- API E2E: `apps/api/__tests__/e2e/{name}.test.ts`

### Test Conventions
- `describe`/`it` block structure grouped by scenario
- Mobile tests focus on isolated pure logic (validation, store) — no component rendering tests
- API integration tests create minimal inline Hono app instances to test route behavior
- Reference story IDs in comments when applicable (e.g., `// Story: 1-1 Email Registration & Login`)
- Always run `npm run typecheck` in addition to tests before completing work

## Code Quality & Style Rules

### Linting
- Mobile: extends `expo` + `@typescript-eslint/recommended`
- API: extends `eslint:recommended` + `@typescript-eslint/recommended`
- No Prettier — formatting handled by ESLint only
- `no-explicit-any: warn`, `no-unused-vars: warn` (allows `_` prefix)

### File & Folder Naming
- Components: `PascalCase.tsx` (e.g., `PlayButton.tsx`, `LibraryItem.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`, `useCredits.ts`)
- Services/utils (mobile): `camelCase.ts` (e.g., `api.ts`, `urlNormalization.ts`)
- Routes/services/middleware (API): `kebab-case.ts` (e.g., `rate-limit.ts`)
- Stores: `camelCase.ts` (e.g., `playerStore.ts`)
- Expo Router pages: lowercase with `(group)` layouts and `[param]` dynamics

### Code Organization
- Mobile components grouped by feature: `player/`, `library/`, `add/`, `auth/`, `ui/`
- API grouped by concern: `routes/`, `services/`, `middleware/`, `lib/`, `utils/`
- API `lib/` = singletons (logger, supabase client); `utils/` = pure functions (errors, url helpers)

### Logging
- API: Pino structured logger via `src/lib/logger.ts` — JSON in prod, pretty in dev
- Pino auto-redacts: `authorization`, `token`, `password`, `api_key`, `secret`
- Mobile: no formal logger — no `console.log` in production code

## Theme (Mobile MVP)
- Monochrome dark (black/white/gray only)
- Background: `bg-black`
- Surface/Cards: `bg-zinc-900` with `border border-zinc-800`
- Text: `text-white` (primary) / `text-zinc-400` (secondary)
- Buttons: `bg-white text-black` or `border border-white text-white`

## Environment Variables

### Mobile (`apps/mobile/.env`)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_REVENUECAT_IOS=          # RevenueCat iOS API key
EXPO_PUBLIC_REVENUECAT_ANDROID=      # RevenueCat Android API key
```

### API (`apps/api/.env`)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FISH_AUDIO_API_KEY=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
REVENUECAT_WEBHOOK_AUTH_KEY=         # RevenueCat webhook authentication key
SENTRY_DSN=                          # Sentry error tracking (optional, no-op if unset)
```

### Web (`apps/web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

## Critical Don't-Miss Rules

### Anti-Patterns
- **Never use `AsyncStorage` for auth tokens** — `expo-secure-store` is configured in `services/supabase.ts`
- **Never use `StyleSheet.create()`** in mobile — NativeWind `className` for all static styles
- **Never use raw `fetch()` in mobile components** — wrap in service functions, consume via React Query hooks
- **Never throw from API route handlers** — always `return c.json({ error: {...} }, status)`
- **Never create `/lib/` in mobile** — use `services/` for clients, `utils/` for pure functions
- **API relative imports must include `.js` extension** (ESM) — mobile imports do not

### Edge Cases
- Mobile uses Tailwind **v3** (NativeWind requirement), web uses Tailwind **v4** — config and class syntax may differ
- `react-native-track-player` requires custom dev client — **cannot run in Expo Go**
- `services/api.ts` uses dynamic `await import('./supabase')` to avoid circular deps — follow this pattern for new service cross-references
- `packages/shared/` exists but is currently empty — no shared code across apps yet

### Security
- All Supabase tables have RLS — never bypass from mobile client
- API uses `service_role` key for admin operations only — never expose to client
- Always use Pino logger (auto-redacts sensitive fields), not `console.log`
- RevenueCat webhook authenticates via Bearer token (`REVENUECAT_WEBHOOK_AUTH_KEY`)

### Performance
- Use `@shopify/flash-list` for large lists — not `FlatList`
- React Query caching handles server data freshness — no manual cache invalidation unless needed
- Audio files served from R2 CDN — never proxy audio through the API server

## Do / Do NOT

**Do:**
- Run `npm run typecheck` before committing
- Follow existing patterns in the codebase
- Keep components small and focused
- Handle loading and error states in UI
- Test on both iOS and Android

**Do NOT:**
- Store secrets in code or commit `.env` files
- Create new files when editing existing ones suffices
- Add features not in the current story scope
- Add mobile-only features to web (background audio, lock screen controls, sleep timer with screen-off)

## Development Workflow Rules

### Monorepo Commands (run from project root)
- `npm run mobile` — Expo dev server (mobile)
- `npm run api` — Hono API with tsx watch + .env auto-loaded
- `npm run web` — Next.js dev server
- `npm run typecheck` — TypeScript check across all workspaces
- `npm run test` — all workspace tests
- `npm run web:deploy` — OpenNext build + Wrangler deploy to Cloudflare Pages
- `npm run api:build` — tsc compile to `dist/` for Hetzner VPS

### Database Migrations
- Location: `supabase/migrations/`
- Naming: `{timestamp}_{description}.sql` (e.g., `20260120000001_initial_schema.sql`)
- All tables: UUID primary keys, `created_at`/`updated_at` timestamps
- RLS enabled on all user-facing tables
- Triggers for auto-operations (e.g., auto-create user profile on signup via `handle_new_user()`)

### Database Schema

| Table | Purpose | Key Details |
|-------|---------|-------------|
| `user_profiles` | User account data | 1:1 with `auth.users` (PK = user UUID). Tracks `subscription_tier` (free/pro), `daily_generations` count, `credits_balance`, `time_bank_minutes`. Auto-created on signup via `handle_new_user()` trigger. |
| `audio_cache` | Generated audio entries | Status pipeline: `pending` → `processing` → `ready` → `failed`. Keyed by `url_hash` (unique). Stores `audio_url`, `duration_seconds`, `word_count`, `voice_id`. Public read for `ready` entries. |
| `user_library` | User's saved articles | Links `user_id` → `audio_id`. Tracks `playback_position` (seconds) and `is_played` flag. Unique constraint on `(user_id, audio_id)`. |
| `playlists` | User-created playlists | Owned by `user_id`. Contains `name` and timestamps. |
| `playlist_items` | Ordered audio in playlists | Junction table: `playlist_id` → `audio_id` with `position` for ordering. Unique on `(playlist_id, audio_id)`. |
| `credit_transactions` | Credit audit trail | Types: `purchase`, `generation`, `refund`, `adjustment`. Stores `credits` delta, `time_bank_delta`, and `metadata` (JSONB). GIN indexes on `metadata->'stripeSessionId'`, `metadata->'stripeChargeId'`, `metadata->'stripePaymentIntent'` for idempotency. |
| `extraction_reports` | URL extraction failure reports | User-submitted when content extraction fails. Status: `new` → `investigating` → `fixed` / `wont_fix`. Insert-only for users; read via service role. |

**Relationships:**
```
auth.users
  └── user_profiles       (1:1, PK = user UUID)
  └── user_library        (1:N)
  │     └── audio_cache   (N:1)
  └── playlists           (1:N)
  │     └── playlist_items (1:N)
  │           └── audio_cache (N:1)
  └── credit_transactions (1:N)
  └── extraction_reports  (1:N, optional user_id)
```

**RPC functions:** `add_credits()`, `deduct_credits()`, `use_time_bank()`, `refund_credits()`, `deduct_credits_for_refund()` — all `SECURITY DEFINER` for atomic credit operations.

### Build & Deploy
- Mobile: EAS Build (cloud builds for iOS — Linux dev environment)
- Web: Cloudflare Pages via `@opennextjs/cloudflare`
- API: Node.js on Hetzner VPS

### CI/CD Pipeline

**CI** (`.github/workflows/ci.yml`): Triggers on push to `main`/`develop` and PRs to `main`. Runs 4 parallel jobs on Node 20:
1. **Lint & Typecheck** — typechecks all three workspaces (mobile, api, web); lints mobile (`continue-on-error`)
2. **Build API** — compiles API with `npm run build`
3. **Test** — runs API and web test suites
4. **Expo Doctor** — runs `npx expo-doctor` on mobile (`continue-on-error`)

**Deploy API** (`.github/workflows/deploy-api.yml`): Triggers on push to `main` when `apps/api/**` or `packages/**` change (+ manual `workflow_dispatch`). Builds the API then POSTs to a Dokploy webhook (`DOKPLOY_WEBHOOK_URL` secret) for deployment to Hetzner VPS.

### Error Monitoring (Sentry)
- API integrates Sentry via `src/lib/sentry.ts` (`@sentry/node`)
- Initialized at startup; no-op if `SENTRY_DSN` env var is unset (safe for local dev)
- Global error handler (`app.onError`) sends unhandled errors to Sentry
- `uncaughtException` and `unhandledRejection` handlers capture + flush Sentry before exit
- Tracing disabled (`tracesSampleRate: 0`) — error capture only

## Code Review Checklist

When performing a code review, ALWAYS complete these steps **in order**:

### Step 1: Run the app and check for warnings (FIRST)
```bash
npm run mobile
```
- Read ALL console warnings - do not ignore them
- **Fix any deprecation warnings immediately** before proceeding
- Check for: deprecated APIs, deprecated imports, deprecated props
- App must run with zero warnings before moving to step 2

### Step 2: Verify functionality
- Navigate to all affected screens
- Test the features that were changed
- Check for runtime errors and crashes

### Step 3: Run tests and typecheck
```bash
npm run test:mobile
npm run test:api
npm run typecheck
```

### Step 4: API server (if API changes)
```bash
npm run api
```
- Test API endpoints manually or with integration tests

### Step 5: Final verification
- Confirm zero warnings in console
- Confirm all tests pass
- Document any issues found

## MVP Launch Requirements

### App Store Requirements (Implemented)
- **Account Deletion**: `DELETE /api/user/account` + UI in Settings (Apple policy since June 2022)
- **Restore Purchases**: Available in Settings screen
- **Terms of Service**: Tappable link to tsucast.com/terms (signup + settings)
- **Privacy Policy**: Tappable link to tsucast.com/privacy (signup + settings)

### RevenueCat Integration
- **SDK**: `react-native-purchases` installed
- **Initialization**: Call `initializePurchases(userId)` after auth
- **Stub Mode**: Returns mock data when API keys not configured (for dev)
- **Webhook**: `POST /api/webhooks/revenuecat` with Bearer token auth

### Remaining External Setup (Not Code)
1. Create RevenueCat dashboard account
2. Create products in App Store Connect / Play Console
3. Link products in RevenueCat dashboard
4. Set `EXPO_PUBLIC_REVENUECAT_IOS` and `EXPO_PUBLIC_REVENUECAT_ANDROID`
5. Configure webhook URL and set `REVENUECAT_WEBHOOK_AUTH_KEY`
6. Create actual Terms/Privacy pages at tsucast.com

## Current Sprint Status

See `_bmad-output/planning-artifacts/sprint-status.yaml` for:
- Epic/story progress
- Implementation priorities
- Dependency order

## References

- Architecture: `_bmad-output/planning-artifacts/architecture-v2.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Stories: `_bmad-output/stories/`

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack or patterns change
- Remove rules that become obvious over time

Last Updated: 2026-01-27
