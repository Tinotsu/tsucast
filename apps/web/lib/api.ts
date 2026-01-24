const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface GenerateRequest {
  url: string;
  voiceId?: string;
}

interface GenerateResponse {
  audioId: string;
  audioUrl: string;
  title: string;
  duration: number;
  wordCount: number;
  remaining?: number;
}

interface CacheCheckResponse {
  cached: boolean;
  audioUrl?: string;
  audioId?: string;
  title?: string;
  duration?: number;
}

interface LimitStatusResponse {
  tier: "free" | "pro";
  used: number;
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
}

interface LibraryItem {
  id: string;
  audio_id: string;
  title: string;
  url: string;
  audio_url: string;
  duration: number;
  playback_position: number;
  is_played: boolean;
  created_at: string;
}

class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    // Import dynamically to avoid SSR issues
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    // getSession() can hang indefinitely due to Supabase SSR bug
    // Add timeout to prevent blocking forever
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 2000);
    });

    const sessionPromise = supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        // Ignore AbortError - happens during fast navigation/remounts
        if (error.name !== "AbortError" && error.message !== "signal is aborted without reason") {
          console.error("Failed to get session:", error);
        }
        return null;
      }
      return data.session?.access_token || null;
    });

    return await Promise.race([sessionPromise, timeoutPromise]);
  } catch (err) {
    // Ignore AbortError - happens during fast navigation/remounts
    if (err instanceof Error && (err.name === "AbortError" || err.message === "signal is aborted without reason")) {
      return null;
    }
    console.error("Error getting auth token:", err);
    return null;
  }
}

// Import shared cookie utility
import { clearAuthCookies } from './cookies';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      // Auto-clear stale cookies on auth errors
      if (response.status === 401) {
        clearAuthCookies();
      }

      throw new ApiError(
        data.error?.message || "An error occurred",
        data.error?.code || "UNKNOWN_ERROR",
        response.status
      );
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError("Request timed out", "TIMEOUT", 408);
    }
    throw err;
  }
}

export async function checkCache(url: string): Promise<CacheCheckResponse> {
  return fetchApi<CacheCheckResponse>(
    `/api/cache/check?url=${encodeURIComponent(url)}`
  );
}

interface GenerateStatusResponse {
  status: "processing" | "ready" | "failed";
  cacheId?: string;
  audioUrl?: string;
  title?: string;
  duration?: number;
  wordCount?: number;
  error?: { message: string };
  message?: string;
  cached?: boolean;
  remaining?: number;
}

async function pollGenerationStatus(
  cacheId: string,
  maxAttempts = 60, // 2 minutes max (60 * 2s)
  intervalMs = 2000
): Promise<GenerateResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await fetchApi<GenerateStatusResponse>(
      `/api/generate/status/${cacheId}`
    );

    if (status.status === "ready" && status.audioUrl) {
      return {
        audioId: cacheId,
        audioUrl: status.audioUrl,
        title: status.title || "Untitled",
        duration: status.duration || 0,
        wordCount: status.wordCount || 0,
      };
    }

    if (status.status === "failed") {
      throw new ApiError(
        status.error?.message || "Generation failed",
        "GENERATION_FAILED",
        500
      );
    }

    // Still processing - wait and retry
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new ApiError("Generation timed out", "TIMEOUT", 408);
}

export async function generateAudio(
  request: GenerateRequest
): Promise<GenerateResponse> {
  const token = await getAuthToken();

  // Use longer timeout for initial request (30s) since it may complete synchronously
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_URL}/api/generate`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    // Handle rate limiting
    if (response.status === 429) {
      throw new ApiError(
        data.error?.message || "Rate limited",
        data.error?.code || "RATE_LIMITED",
        429
      );
    }

    // Handle 202 - generation in progress, need to poll
    if (response.status === 202 && data.cacheId) {
      return pollGenerationStatus(data.cacheId);
    }

    // Handle errors
    if (!response.ok) {
      throw new ApiError(
        data.error?.message || "An error occurred",
        data.error?.code || "UNKNOWN_ERROR",
        response.status
      );
    }

    // Handle immediate success (cached or fast generation)
    if (data.status === "ready" && data.audioUrl) {
      return {
        audioId: data.cacheId || data.audioUrl.split("/").pop() || "unknown",
        audioUrl: data.audioUrl,
        title: data.title || "Untitled",
        duration: data.duration || 0,
        wordCount: data.wordCount || 0,
        remaining: data.remaining,
      };
    }

    // Fallback - shouldn't reach here normally
    throw new ApiError("Unexpected response format", "UNKNOWN_ERROR", 500);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError("Request timed out", "TIMEOUT", 408);
    }
    throw err;
  }
}

export async function getLimitStatus(): Promise<LimitStatusResponse> {
  return fetchApi<LimitStatusResponse>("/api/user/limit");
}

interface SubscriptionStatusResponse {
  tier: "free" | "pro";
  isPro: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
  subscription: {
    expiresAt: string | null;
    productId: string | null;
    managementUrl: string | null;
    store: string | null;
  } | null;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  return fetchApi<SubscriptionStatusResponse>("/api/user/subscription");
}

export async function getLibrary(): Promise<LibraryItem[]> {
  const response = await fetchApi<{ items: LibraryItem[] }>("/api/library");
  return response.items;
}

export async function updatePlaybackPosition(
  audioId: string,
  position: number
): Promise<void> {
  await fetchApi(`/api/library/${audioId}/position`, {
    method: "PATCH",
    body: JSON.stringify({ position }),
  });
}

export async function deleteLibraryItem(audioId: string): Promise<void> {
  await fetchApi(`/api/library/${audioId}`, {
    method: "DELETE",
  });
}

export async function deleteAccount(): Promise<void> {
  await fetchApi("/api/user/account", {
    method: "DELETE",
  });
}

export type {
  GenerateRequest,
  GenerateResponse,
  CacheCheckResponse,
  LimitStatusResponse,
  LibraryItem,
  SubscriptionStatusResponse,
};

export { ApiError };
