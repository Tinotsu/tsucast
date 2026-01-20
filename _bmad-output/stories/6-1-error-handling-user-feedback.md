# Story 6.1: Error Handling & User Feedback

Status: ready-for-dev

## Story

As a user who encounters an error,
I want clear feedback and recovery options,
so that I'm not frustrated when things fail.

## Acceptance Criteria

1. **AC1: Network Errors**
   - Given network is unavailable
   - When user tries to generate audio
   - Then they see: "No internet connection"
   - And can tap "Retry" when connected

2. **AC2: TTS Generation Errors**
   - Given TTS generation fails
   - When Fish Audio returns an error
   - Then user sees: "Audio generation failed. Try again?"
   - And can retry or try a different article

3. **AC3: Generic Errors**
   - Given an unexpected error occurs
   - When the app catches an exception
   - Then user sees generic: "Something went wrong"
   - And error is logged (not shown to user)
   - And "Retry" option is available

4. **AC4: Rate Limit Errors**
   - Given rate limiting occurs
   - When user hits API limits
   - Then they see friendly message (not technical)
   - And are given a reasonable wait time

5. **AC5: Dismissible Errors**
   - Given any error occurs
   - When user sees error message
   - Then they can dismiss with one tap
   - And are not blocked from using other features

6. **AC6: Health Endpoint**
   - Given external monitoring checks the API
   - When it requests GET /health
   - Then API returns status of all dependencies (db, r2, fish_audio reachable)
   - And response time is under 500ms
   - And returns 200 if healthy, 503 if degraded

7. **AC7: Request Timeout**
   - Given a TTS generation request is made
   - When Fish Audio takes longer than 120 seconds
   - Then the request times out gracefully
   - And user sees: "Generation is taking too long. Please try again."
   - And partial data is cleaned up

8. **AC8: Structured Logging**
   - Given any API request is processed
   - When logs are written
   - Then logs are in structured JSON format
   - And include: request_id, user_id, endpoint, duration_ms, status_code
   - And sensitive data (tokens, passwords) is never logged

## Tasks / Subtasks

### Task 1: Error Boundary Component (AC: 3)
- [ ] 1.1 Create `components/ErrorBoundary.tsx`:
  ```typescript
  import React from 'react';

  interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }

  interface State {
    hasError: boolean;
    error?: Error;
  }

  export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      // Log to error tracking service
      console.error('ErrorBoundary caught:', error, errorInfo);
      // Sentry.captureException(error);
    }

    render() {
      if (this.state.hasError) {
        return this.props.fallback || (
          <View className="flex-1 items-center justify-center p-8">
            <Ionicons name="warning" size={64} color="#DC2626" />
            <Text className="mt-4 text-lg font-bold text-gray-900">
              Something went wrong
            </Text>
            <Text className="mt-2 text-gray-600 text-center">
              We're sorry for the inconvenience. Please try again.
            </Text>
            <TouchableOpacity
              onPress={() => this.setState({ hasError: false })}
              className="mt-6 bg-amber-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-medium">Try Again</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return this.props.children;
    }
  }
  ```
- [ ] 1.2 Wrap app in ErrorBoundary in `app/_layout.tsx`

### Task 2: Toast Notification System (AC: 1, 2, 3, 5)
- [ ] 2.1 Install and configure toast:
  ```bash
  npm install react-native-toast-message
  ```
- [ ] 2.2 Create `components/ui/Toast.tsx` config:
  ```typescript
  import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

  export const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: '#10B981' }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{ fontSize: 16, fontWeight: '600' }}
        text2Style={{ fontSize: 14 }}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={{ borderLeftColor: '#DC2626' }}
        text1Style={{ fontSize: 16, fontWeight: '600' }}
        text2Style={{ fontSize: 14 }}
      />
    ),
    info: (props: any) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: '#F59E0B' }}
        text1Style={{ fontSize: 16, fontWeight: '600' }}
        text2Style={{ fontSize: 14 }}
      />
    ),
  };
  ```
- [ ] 2.3 Add Toast component to root layout

### Task 3: Toast Hook (AC: 1, 2, 3, 4)
- [ ] 3.1 Create `hooks/useToast.ts`:
  ```typescript
  import Toast from 'react-native-toast-message';

  export function useToast() {
    const showSuccess = (title: string, message?: string) => {
      Toast.show({
        type: 'success',
        text1: title,
        text2: message,
        visibilityTime: 3000,
      });
    };

    const showError = (title: string, message?: string) => {
      Toast.show({
        type: 'error',
        text1: title,
        text2: message,
        visibilityTime: 4000,
      });
    };

    const showInfo = (title: string, message?: string) => {
      Toast.show({
        type: 'info',
        text1: title,
        text2: message,
        visibilityTime: 3000,
      });
    };

    const showNetworkError = () => {
      showError('No internet connection', 'Please check your connection and try again');
    };

    const showGenerationError = () => {
      showError('Audio generation failed', 'Please try again or try a different article');
    };

    const showRateLimitError = (resetIn?: string) => {
      showInfo(
        "You've reached your daily limit",
        resetIn ? `Try again ${resetIn}` : 'Upgrade for unlimited access'
      );
    };

    return {
      showSuccess,
      showError,
      showInfo,
      showNetworkError,
      showGenerationError,
      showRateLimitError,
    };
  }
  ```

### Task 4: Network Status Detection (AC: 1)
- [ ] 4.1 Install NetInfo:
  ```bash
  npx expo install @react-native-community/netinfo
  ```
- [ ] 4.2 Create `hooks/useNetworkStatus.ts`:
  ```typescript
  import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

  export function useNetworkStatus() {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
      const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        setIsConnected(state.isConnected ?? true);
      });

      return () => unsubscribe();
    }, []);

    return { isConnected };
  }
  ```
- [ ] 4.3 Check network before API calls:
  ```typescript
  const handleGenerate = async () => {
    if (!isConnected) {
      showNetworkError();
      return;
    }
    // ... proceed with generation
  };
  ```

### Task 5: Health Endpoint (AC: 6)
- [ ] 5.1 Create `apps/api/src/routes/health.ts`:
  ```typescript
  import { Hono } from 'hono';
  import { supabase } from '../services/supabase';
  import { r2Client } from '../services/storage';

  const health = new Hono();

  health.get('/health', async (c) => {
    const startTime = Date.now();
    const checks = {
      status: 'ok' as 'ok' | 'degraded',
      timestamp: new Date().toISOString(),
      duration_ms: 0,
      services: {
        database: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
        storage: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
        tts: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
      }
    };

    // Check Supabase connection
    try {
      const { error } = await supabase.from('audio_cache').select('count').limit(1);
      checks.services.database = error ? 'unhealthy' : 'healthy';
    } catch {
      checks.services.database = 'unhealthy';
    }

    // Check R2 connection
    try {
      await r2Client.headBucket({ Bucket: process.env.R2_BUCKET });
      checks.services.storage = 'healthy';
    } catch {
      checks.services.storage = 'unhealthy';
    }

    // Check Fish Audio API (lightweight ping)
    try {
      const res = await fetch('https://api.fish.audio/v1/voices', {
        method: 'HEAD',
        headers: { Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      checks.services.tts = res.ok ? 'healthy' : 'unhealthy';
    } catch {
      checks.services.tts = 'unhealthy';
    }

    // Determine overall status
    const unhealthyServices = Object.values(checks.services).filter(s => s === 'unhealthy');
    if (unhealthyServices.length > 0) {
      checks.status = 'degraded';
    }

    checks.duration_ms = Date.now() - startTime;

    return c.json(checks, checks.status === 'ok' ? 200 : 503);
  });

  export default health;
  ```
- [ ] 5.2 Register route in main app (public, no auth)

### Task 6: Request Timeout Middleware (AC: 7)
- [ ] 6.1 Create `apps/api/src/middleware/timeout.ts`:
  ```typescript
  import { Context, Next } from 'hono';

  const DEFAULT_TIMEOUT = 120_000; // 120 seconds

  export function timeoutMiddleware(timeoutMs = DEFAULT_TIMEOUT) {
    return async (c: Context, next: Next) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      c.set('abortSignal', controller.signal);

      try {
        await next();
      } catch (error) {
        if (error.name === 'AbortError') {
          return c.json({
            error: {
              code: 'TIMEOUT',
              message: 'Generation is taking too long. Please try again.'
            }
          }, 408);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    };
  }
  ```
- [ ] 6.2 Apply to generate route:
  ```typescript
  app.use('/api/generate', timeoutMiddleware(120_000));
  ```
- [ ] 6.3 Use abort signal in TTS service:
  ```typescript
  const response = await fetch(fishAudioUrl, {
    signal: c.get('abortSignal'),
    // ...
  });
  ```

### Task 7: Structured Logging with Pino (AC: 8)
- [ ] 7.1 Install Pino:
  ```bash
  npm install pino pino-pretty
  npm install -D @types/pino
  ```
- [ ] 7.2 Create `apps/api/src/lib/logger.ts`:
  ```typescript
  import pino from 'pino';

  export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'password',
        'token',
        '*.password',
        '*.token',
      ],
      remove: true,
    },
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
  });
  ```
- [ ] 7.3 Create `apps/api/src/middleware/logging.ts`:
  ```typescript
  import { Context, Next } from 'hono';
  import { randomUUID } from 'crypto';
  import { logger } from '../lib/logger';

  export async function loggingMiddleware(c: Context, next: Next) {
    const requestId = randomUUID();
    const startTime = Date.now();

    c.set('requestId', requestId);
    c.header('X-Request-ID', requestId);

    // Log request
    logger.info({
      request_id: requestId,
      type: 'request',
      method: c.req.method,
      path: c.req.path,
      user_agent: c.req.header('user-agent'),
    });

    await next();

    const duration = Date.now() - startTime;
    const user = c.get('user');

    // Log response
    logger.info({
      request_id: requestId,
      type: 'response',
      user_id: user?.id || 'anonymous',
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration_ms: duration,
    });
  }
  ```
- [ ] 7.4 Apply middleware to all routes:
  ```typescript
  app.use('*', loggingMiddleware);
  ```

### Task 8: Error State Component (AC: 3, 5)
- [ ] 8.1 Create `components/ui/ErrorState.tsx`:
  ```typescript
  interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    onDismiss?: () => void;
  }

  export function ErrorState({
    title = 'Something went wrong',
    message = 'Please try again',
    onRetry,
    onDismiss,
  }: ErrorStateProps) {
    return (
      <View className="p-6 bg-red-50 dark:bg-red-950 rounded-xl">
        <View className="flex-row items-start">
          <Ionicons name="alert-circle" size={24} color="#DC2626" />
          <View className="flex-1 ml-3">
            <Text className="text-base font-semibold text-red-800 dark:text-red-200">
              {title}
            </Text>
            <Text className="mt-1 text-sm text-red-700 dark:text-red-300">
              {message}
            </Text>
          </View>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss}>
              <Ionicons name="close" size={20} color="#991B1B" />
            </TouchableOpacity>
          )}
        </View>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            className="mt-4 bg-red-100 dark:bg-red-900 py-2 rounded-lg"
          >
            <Text className="text-center text-red-800 dark:text-red-200 font-medium">
              Try Again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  ```

### Task 9: Sentry Integration (AC: 3)
- [ ] 9.1 Install Sentry:
  ```bash
  npx expo install @sentry/react-native
  ```
- [ ] 9.2 Configure Sentry in `app/_layout.tsx`:
  ```typescript
  import * as Sentry from '@sentry/react-native';

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enableAutoSessionTracking: true,
    environment: __DEV__ ? 'development' : 'production',
  });
  ```
- [ ] 9.3 Wrap ErrorBoundary to report to Sentry

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Health endpoint at `/health`
- 120s timeout for TTS requests
- Pino for structured JSON logging
- Sentry for error tracking

**Error Handling Philosophy:**
- User-friendly messages
- Always provide recovery option
- Log details server-side
- Never expose technical errors to users

### Source Tree Components

```
apps/mobile/
├── app/
│   └── _layout.tsx          # ErrorBoundary, Toast, Sentry
├── components/
│   ├── ErrorBoundary.tsx
│   └── ui/
│       ├── Toast.tsx
│       └── ErrorState.tsx
└── hooks/
    ├── useToast.ts
    └── useNetworkStatus.ts

apps/api/
└── src/
    ├── routes/
    │   └── health.ts        # GET /health
    ├── middleware/
    │   ├── timeout.ts
    │   └── logging.ts
    └── lib/
        └── logger.ts
```

### Testing Standards

- Test network offline → appropriate message
- Test TTS failure → retry option shown
- Test timeout → graceful message
- Test health endpoint → returns correct status
- Test logging → JSON format, no sensitive data
- Test error boundary → catches exceptions

### Key Technical Decisions

1. **Pino:** Fast, structured, production-ready logging
2. **Toast:** Non-blocking error notifications
3. **Error Boundary:** Catch and recover from React errors
4. **Health Check:** Monitor all dependencies

### Dependencies

- All previous stories should be completed
- Sentry account for error tracking

### References

- [Source: architecture-v2.md#Health-Check-Endpoint]
- [Source: architecture-v2.md#Request-Timeout-Middleware]
- [Source: architecture-v2.md#Structured-Logging-Setup]
- [Source: epics.md#Story-6.1-Error-Handling-User-Feedback]
- [Source: prd.md#FR45-FR47]
- [Pino Documentation](https://getpino.io/)
- [Sentry React Native](https://docs.sentry.io/platforms/react-native/)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
