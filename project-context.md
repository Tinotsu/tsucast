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

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | Expo SDK 54, React Native, expo-router v6 |
| Web Frontend | Next.js 14+ (App Router) |
| Styling | NativeWind v4 (mobile), Tailwind CSS (web) |
| State | React Query (server), Zustand (client) |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| API Server | Node.js + Hono (Hetzner VPS) |
| TTS | Fish Audio API |
| Storage | Cloudflare R2 |
| Payments | RevenueCat |

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

## Critical Patterns

### 1. File Naming
- Components: `PascalCase.tsx` (e.g., `VoiceSelector.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`)
- Routes: `kebab-case` directories in expo-router

### 2. Authentication
- Auth is handled by Supabase directly from mobile app
- VPS validates Supabase JWT tokens via middleware
- Never store auth tokens in AsyncStorage - use `expo-secure-store`

### 3. Database Access
- Mobile app uses Supabase client with RLS policies
- VPS uses service role key for admin operations
- All tables have Row Level Security enabled

### 4. API Patterns
```typescript
// All API responses follow this shape
interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### 5. Error Handling
- Map technical errors to user-friendly messages
- Never expose stack traces or internal errors to users
- Log errors server-side with request IDs

### 6. Styling (NativeWind)
- Use Tailwind classes via `className` prop
- Theme: Monochrome dark (black/white/gray only for MVP)
- Background: `bg-black`
- Surface/Cards: `bg-zinc-900` with `border border-zinc-800`
- Text: `text-white` (primary) / `text-zinc-400` (secondary)
- Buttons: `bg-white text-black` or `border border-white text-white`

### 7. State Management
- Server state: React Query (`useQuery`, `useMutation`)
- Client state: Zustand (player state, UI state)
- Auth state: `useAuth` hook (wraps Supabase)

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
```

### Web (`apps/web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

## Do NOT

- Use `console.log` in production code (use proper logger)
- Store secrets in code or commit `.env` files
- Skip TypeScript types (strict mode enabled)
- Use `any` type without justification
- Create new files when editing existing ones suffices
- Add features not in the current story scope
- Add mobile-only features to web (background audio, lock screen controls, sleep timer with screen-off)

## Do

- Run `npm run typecheck` before committing
- Follow existing patterns in the codebase
- Keep components small and focused
- Use meaningful variable names
- Handle loading and error states in UI
- Test on both iOS and Android

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
