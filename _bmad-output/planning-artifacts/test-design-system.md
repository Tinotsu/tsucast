# System-Level Test Design: tsucast

**Date:** 2026-01-22
**Author:** Murat (TEA Agent)
**Status:** Draft
**Platforms:** Mobile (Expo/React Native) + Web (Next.js) + API (Hono)

---

## Executive Summary

System-level testability review for tsucast covering:
- **Mobile App** (Expo SDK 54 + React Native) - PRIMARY product
- **Web App** (Next.js 14+ App Router) - SECONDARY (testing/marketing/admin)
- **API Server** (Node.js + Hono on VPS)

**Current Test State:** Foundation exists but gaps in E2E coverage, security testing, and performance validation.

---

## Testability Assessment

### Controllability: PASS with CONCERNS

| Aspect | Status | Details |
|--------|--------|---------|
| API seeding | ✅ PASS | `npm run db:seed` exists, Supabase supports test data |
| External service mocking | ✅ PASS | Fish Audio, R2 can be mocked via MSW |
| State management | ✅ PASS | React Query (server) + Zustand (client) - both testable |
| Mobile testing on Linux | ⚠️ CONCERN | No local iOS - requires EAS Build or Expo Go |
| Rate limiting testing | ⚠️ CONCERN | In-memory rate limiting hard to test at limits |

**Recommendation:** Add Redis-backed rate limiting mock for tests, or extract rate limit logic into testable module.

### Observability: PASS with CONCERNS

| Aspect | Status | Details |
|--------|--------|---------|
| Structured logging | ✅ PASS | Pino configured with JSON output |
| Health endpoint | ✅ PASS | `/health` monitors db, r2, fish_audio |
| Error tracking | ⚠️ CONCERN | Sentry planned but not yet configured |
| APM/Tracing | ⚠️ CONCERN | No distributed tracing in place |
| Request IDs | ✅ PASS | `X-Request-ID` header implemented |

**Recommendation:** Configure Sentry before launch. Add `x-trace-id` for distributed tracing when adding Redis/job queue.

### Reliability: PASS with CONCERNS

| Aspect | Status | Details |
|--------|--------|---------|
| Test isolation | ✅ PASS | Jest/Vitest setup, tests run independently |
| Deterministic state | ✅ PASS | React Query + Zustand provide predictable state |
| Parallel-safe tests | ✅ PASS | No shared mutable state in tests |
| Circuit breaker | ⚠️ CONCERN | Not implemented for Fish Audio calls |
| Retry logic | ⚠️ CONCERN | No explicit retry strategy for TTS failures |

**Recommendation:** Add retry logic (3 attempts with exponential backoff) for Fish Audio API calls. Consider circuit breaker pattern for external service failures.

---

## Existing Test Coverage

### API (`apps/api/__tests__/`)

| Type | Tests | Coverage |
|------|-------|----------|
| Unit | `errors.test.ts`, `parser.test.ts`, `pdfParser.test.ts`, `fetcher.test.ts` | Core parsing logic |
| Integration | `cache.test.ts`, `report.test.ts`, `generate.test.ts` | Database operations |
| E2E | `extraction.test.ts` | Full extraction flow |

### Mobile (`apps/mobile/__tests__/`)

| Type | Tests | Coverage |
|------|-------|----------|
| Unit/Auth | `authErrorMessages.test.ts`, `formValidation.test.ts` | Auth error handling |
| Unit/Player | `playerStore.test.ts`, `playbackSpeed.test.ts`, `sleepTimer.test.ts`, `voices.test.ts` | Player state |
| Unit/Core | `urlNormalization.test.ts`, `validation.test.ts` | Input validation |

### Web (`apps/web/__tests__/`)

| Type | Tests | Coverage |
|------|-------|----------|
| Components | `AuthForm.test.tsx`, `WebPlayer.test.tsx`, `UrlInput.test.tsx`, `VoiceSelector.test.tsx` | UI components |
| Pages | `landing.test.tsx`, `generate.test.tsx`, `library.test.tsx`, `settings.test.tsx` | Page rendering |
| Unit | `utils.test.ts`, `api.test.ts` | Utilities |

---

## Architecturally Significant Requirements (ASRs)

| ASR ID | Requirement | Source | Risk Score | Test Approach |
|--------|-------------|--------|------------|---------------|
| ASR-1 | Time to first audio < 10s | NFR1 | **9** (Critical) | k6 load test + E2E timing validation |
| ASR-2 | 99% API uptime | NFR13 | **6** (High) | Health check monitoring + E2E reliability |
| ASR-3 | Secure auth (JWT validation) | NFR6-9 | **6** (High) | Security tests (OWASP, auth bypass) |
| ASR-4 | Parse accuracy > 95% | Success Criteria | **4** (Medium) | Integration tests with diverse URLs |
| ASR-5 | Handle 1,000 concurrent TTS | NFR10 | **4** (Medium) | k6 stress test |
| ASR-6 | Cross-device library sync | FR38 | **3** (Medium) | Integration tests |

---

## Test Levels Strategy

### Recommended Split by Platform

```
┌─────────────────────────────────────────────────────────────────┐
│                      TEST PYRAMID                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MOBILE APP          WEB APP             API SERVER             │
│  (Primary)           (Secondary)         (Shared)               │
│                                                                 │
│  ┌─────────┐         ┌─────────┐         ┌─────────┐           │
│  │E2E: 20% │         │E2E: 20% │         │E2E: 20% │           │
│  │(Maestro)│         │(Playwrt)│         │(Supertest)          │
│  ├─────────┤         ├─────────┤         ├─────────┤           │
│  │Int: 30% │         │Comp: 40%│         │Int: 40% │           │
│  │(Hooks,  │         │(RTL,    │         │(DB ops, │           │
│  │ RQ, RN) │         │ Jest)   │         │ service)│           │
│  ├─────────┤         ├─────────┤         ├─────────┤           │
│  │Unit: 50%│         │Unit: 40%│         │Unit: 40%│           │
│  │(Stores, │         │(Utils,  │         │(Parser, │           │
│  │ Logic)  │         │ API)    │         │ Errors) │           │
│  └─────────┘         └─────────┘         └─────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Rationale

| Platform | Unit/Int | E2E | Why |
|----------|----------|-----|-----|
| **Mobile** | 80% | 20% | Can't run iOS locally (Linux dev), unit tests give fast feedback |
| **Web** | 80% | 20% | Component tests with RTL provide good UI coverage |
| **API** | 80% | 20% | Integration tests validate DB + service contracts |

### E2E Testing Tools

| Platform | Recommended Tool | Rationale |
|----------|-----------------|-----------|
| Mobile | **Maestro** | YAML-based, works with Expo, runs on cloud |
| Web | **Playwright** | Best-in-class, fast, reliable |
| API | **Supertest** + Jest | Already in use, good coverage |

---

## NFR Testing Approach

### Security (OWASP + Auth)

| Test | Tool | Priority | Status |
|------|------|----------|--------|
| Unauthenticated route protection | Playwright/Jest | P0 | ❌ Missing |
| JWT token validation | Jest (API) | P0 | ⚠️ Partial |
| JWT token expiry | Jest (API) | P1 | ❌ Missing |
| SQL injection prevention | Drizzle ORM (automatic) | P0 | ✅ Covered |
| XSS sanitization | React (automatic) | P0 | ✅ Covered |
| RBAC (user owns resources) | Jest (API) | P0 | ⚠️ Partial (RLS policies) |
| Secret handling (no password logs) | Jest (API) | P1 | ❌ Missing |

**Gap:** Need explicit security tests for auth flow, token expiry, and RBAC enforcement.

### Performance (k6)

| Test | Threshold | Tool | Priority | Status |
|------|-----------|------|----------|--------|
| Time to first audio | < 10s (P95) | k6 | P0 | ❌ Missing |
| API response time | < 500ms (P95) | k6 | P0 | ❌ Missing |
| Error rate under load | < 1% | k6 | P0 | ❌ Missing |
| Concurrent TTS requests | 100 VUs | k6 | P1 | ❌ Missing |
| Homepage load | < 2s (P95) | Lighthouse/k6 | P2 | ❌ Missing |

**Gap:** No performance testing framework in place. Critical for validating < 10s streaming.

### Reliability (Error Handling)

| Test | Tool | Priority | Status |
|------|------|----------|--------|
| API 500 → graceful UI error | Playwright/Jest | P0 | ❌ Missing |
| Retry on transient failures | Jest (API) | P1 | ❌ Missing |
| Network disconnection handling | Playwright | P1 | ❌ Missing |
| Health check endpoint | Jest (API) | P0 | ⚠️ Partial |
| Rate limit 429 handling | Jest | P1 | ❌ Missing |

**Gap:** No explicit error handling/resilience tests.

### Maintainability

| Metric | Target | Tool | Status |
|--------|--------|------|--------|
| Test coverage | ≥ 80% | Jest --coverage | ⚠️ Unknown |
| Code duplication | < 5% | jscpd | ❌ Not measured |
| Vulnerabilities | 0 critical/high | npm audit | ⚠️ Not in CI |
| TypeScript strict | Enabled | tsc | ✅ Enabled |

**Gap:** Need coverage reporting and npm audit in CI.

---

## Test Environment Requirements

### Local Development

| Environment | Purpose | Setup |
|-------------|---------|-------|
| Unit/Integration | Fast feedback | `npm run test:*` |
| API E2E | Full extraction flow | Local Supabase + mock TTS |
| Mobile | Expo Go on device | `npm run mobile` |
| Web | Local Next.js | `npm run web` |

### CI/CD Pipeline

| Stage | Tests | Trigger |
|-------|-------|---------|
| Pre-commit | Unit tests (fast) | Husky hook |
| PR to main | All tests + coverage | GitHub Actions |
| Nightly | Performance (k6) | Scheduled |
| Pre-release | Full E2E + security | Manual |

### External Service Mocking

| Service | Mock Strategy |
|---------|---------------|
| Fish Audio TTS | MSW + mock audio response |
| Cloudflare R2 | LocalStack or mock S3 |
| Supabase Auth | Supabase local or mock JWT |
| RevenueCat | Mock webhook responses |

---

## Testability Concerns (Action Required)

### High Priority (Score ≥ 6)

| Concern | Impact | Mitigation | Owner |
|---------|--------|------------|-------|
| **No < 10s validation** | Core value prop untested | Add k6 performance test | QA |
| **No E2E for mobile** | Critical journeys untested | Add Maestro tests | QA |
| **No security tests** | Auth bypass risk | Add Playwright security suite | QA |
| **Circuit breaker missing** | TTS failures cascade | Add retry + circuit breaker | Dev |

### Medium Priority (Score 3-5)

| Concern | Impact | Mitigation | Owner |
|---------|--------|------------|-------|
| **No coverage reporting** | Gaps unknown | Add `test:coverage` to CI | Dev |
| **Sentry not configured** | Errors invisible | Configure Sentry | Dev |
| **Rate limit hard to test** | Edge cases untested | Extract rate limit module | Dev |

### Low Priority (Score 1-2)

| Concern | Impact | Mitigation | Owner |
|---------|--------|------------|-------|
| **No APM/tracing** | Debug difficulty at scale | Add at 1,000 users | Ops |
| **Manual E2E on iOS** | Slow feedback | Accept for MVP | - |

---

## Recommendations for Sprint 0

### Immediate (Before Launch)

1. **Add k6 performance test** for `/api/generate` endpoint
   - Validate < 10s time to first audio under load
   - Target: 50 concurrent users, P95 < 10s

2. **Add Playwright E2E for web** (3-5 critical journeys)
   - Login → Generate → Playback flow
   - Error handling (bad URL, network failure)
   - Subscription upgrade flow

3. **Add security test suite**
   - Unauthenticated route protection
   - JWT validation and expiry
   - RBAC enforcement (user can't access others' data)

4. **Configure Sentry** for error tracking

### Post-Launch

5. **Add Maestro tests for mobile** (critical journeys)
6. **Add retry logic + circuit breaker** for Fish Audio
7. **Add coverage reporting to CI** with 80% threshold
8. **Add npm audit to CI** (block on critical/high)

---

## Quality Gate Criteria

### Pre-Launch Gate

| Criteria | Threshold | Status |
|----------|-----------|--------|
| Unit tests pass | 100% | ✅ (existing) |
| Integration tests pass | 100% | ✅ (existing) |
| P0 scenarios validated | 100% | ❌ (need E2E) |
| Security tests pass | 100% | ❌ (need tests) |
| < 10s streaming validated | k6 P95 < 10s | ❌ (need k6) |
| Sentry configured | Yes | ❌ (pending) |

### Ongoing (CI)

| Criteria | Threshold |
|----------|-----------|
| All tests pass | 100% |
| Coverage | ≥ 80% |
| npm audit | 0 critical/high |
| P95 response time | < 500ms |

---

## Follow-on Workflows

After this system-level review:

1. **`*framework`** - Initialize Playwright for web E2E
2. **`*atdd`** - Generate failing tests for P0 scenarios before implementation
3. **`*ci`** - Scaffold CI/CD pipeline with quality gates
4. **`*nfr-assess`** - Full NFR validation before release

---

## Appendix: Test File Inventory

### API Tests
```
apps/api/__tests__/
├── unit/
│   ├── errors.test.ts
│   ├── parser.test.ts
│   ├── pdfParser.test.ts
│   └── fetcher.test.ts
├── integration/
│   ├── cache.test.ts
│   ├── report.test.ts
│   └── generate.test.ts
└── e2e/
    └── extraction.test.ts
```

### Mobile Tests
```
apps/mobile/__tests__/
├── unit/
│   ├── urlNormalization.test.ts
│   ├── validation.test.ts
│   ├── auth/
│   │   ├── authErrorMessages.test.ts
│   │   └── formValidation.test.ts
│   └── player/
│       ├── playerStore.test.ts
│       ├── playbackSpeed.test.ts
│       ├── sleepTimer.test.ts
│       └── voices.test.ts
```

### Web Tests
```
apps/web/__tests__/
├── landing.test.tsx
├── unit/
│   ├── utils.test.ts
│   └── api.test.ts
├── components/
│   ├── AuthForm.test.tsx
│   ├── WebPlayer.test.tsx
│   ├── UrlInput.test.tsx
│   └── VoiceSelector.test.tsx
└── pages/
    ├── generate.test.tsx
    ├── library.test.tsx
    └── settings.test.tsx
```

---

**Generated by:** BMad TEA Agent - Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design` (System-Level Mode)
**Version:** 4.0 (BMad v6)
