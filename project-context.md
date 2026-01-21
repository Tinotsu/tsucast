# tsucast - Project Context

> Critical rules and patterns for AI agents implementing code in this project.

## Project Overview

**tsucast** converts any web article into a podcast using AI text-to-speech. Users paste a URL, select a voice, and receive streamable audio in under 10 seconds.

**Target:** 1,000 paid subscribers in 3 months (YC goal)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | Expo SDK 54, React Native, expo-router v6 |
| Styling | NativeWind v4 (Tailwind CSS) |
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
│   ├── mobile/          # Expo React Native app
│   │   ├── app/         # expo-router pages
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API clients
│   │   └── stores/      # Zustand stores
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
```

### API (`apps/api/.env`)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FISH_AUDIO_API_KEY=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
```

## Do NOT

- Use `console.log` in production code (use proper logger)
- Store secrets in code or commit `.env` files
- Skip TypeScript types (strict mode enabled)
- Use `any` type without justification
- Create new files when editing existing ones suffices
- Add features not in the current story scope

## Do

- Run `npm run typecheck` before committing
- Follow existing patterns in the codebase
- Keep components small and focused
- Use meaningful variable names
- Handle loading and error states in UI
- Test on both iOS and Android

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
