import { emitAuthEvent } from './auth-events';

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
}

interface CacheCheckResponse {
  cached: boolean;
  audioUrl?: string;
  audioId?: string;
  title?: string;
  duration?: number;
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
    // Read token directly from cookie to bypass the Supabase SSR client
    // initialization deadlock (supabase/supabase-js#1594).
    const { getAccessTokenFromCookie } = await import("@/lib/auth-token");
    return getAccessTokenFromCookie();
  } catch (err) {
    // Ignore AbortError - happens during fast navigation/remounts
    if (err instanceof Error && (err.name === "AbortError" || err.message === "signal is aborted without reason")) {
      return null;
    }
    console.error("Error getting auth token:", err);
    return null;
  }
}

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = ["/api/cache/check", "/api/free-content"];

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  // If no token and not a public endpoint, fail fast instead of sending
  // an unauthenticated request that will 401 and trigger a logout cascade
  const isPublic = PUBLIC_ENDPOINTS.some((p) => endpoint.startsWith(p));
  if (!token && !isPublic) {
    throw new ApiError(
      "Authentication token unavailable",
      "AUTH_TOKEN_UNAVAILABLE",
      0
    );
  }

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

    let data: any;
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        if (response.status === 401) {
          emitAuthEvent("unauthorized");
        }
        throw new ApiError(
          `Server error (${response.status})`,
          "SERVER_ERROR",
          response.status
        );
      }
      throw new ApiError("Invalid response from server", "PARSE_ERROR", 502);
    }

    if (!response.ok) {
      // Notify React auth state so useAuth can sign out and redirect
      if (response.status === 401) {
        emitAuthEvent("unauthorized");
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
    if (err instanceof ApiError) {
      throw err;
    }
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

// Free content types and API
export interface FreeContentItem {
  id: string;
  title: string;
  voice_id: string;
  source_url: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  word_count: number | null;
  file_size_bytes: number | null;
  status: "pending" | "processing" | "ready" | "failed";
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export async function getFreeContent(): Promise<FreeContentItem[]> {
  const response = await fetchApi<{ items: FreeContentItem[] }>("/api/free-content");
  return response.items;
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

  // Fail fast if no token — don't send unauthenticated request
  if (!token) {
    throw new ApiError(
      "Authentication token unavailable",
      "AUTH_TOKEN_UNAVAILABLE",
      0
    );
  }

  // Use longer timeout for initial request (30s) since it may complete synchronously
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_URL}/api/generate`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    clearTimeout(timeoutId);

    let data: any;
    try {
      data = await response.json();
    } catch {
      if (response.status === 401) {
        emitAuthEvent("unauthorized");
      }
      throw new ApiError(
        `Server error (${response.status})`,
        "SERVER_ERROR",
        response.status || 502
      );
    }

    // Handle auth errors
    if (response.status === 401) {
      emitAuthEvent("unauthorized");
      throw new ApiError(
        data.error?.message || "Authentication required",
        data.error?.code || "UNAUTHORIZED",
        401
      );
    }

    // Handle insufficient credits
    if (response.status === 402) {
      throw new ApiError(
        data.error?.message || "Insufficient credits",
        data.error?.code || "INSUFFICIENT_CREDITS",
        402
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

// TODO: Remove when mobile migrates to credits
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

// TODO: Remove when mobile migrates to credits
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

// Credit system endpoints

interface CreditBalance {
  credits: number;
  timeBank: number;
  totalPurchased: number;
  totalUsed: number;
}

export async function getCreditBalance(): Promise<CreditBalance> {
  return fetchApi<CreditBalance>("/api/user/credits");
}

interface CreditPreview {
  isCached: boolean;
  estimatedMinutes: number;
  wordCount?: number;
  creditsNeeded: number;
  currentCredits: number;
  currentTimeBank: number;
  hasSufficientCredits: boolean;
  estimationFailed?: boolean;
}

export async function previewCreditCost(url: string, voiceId?: string): Promise<CreditPreview> {
  return fetchApi<CreditPreview>("/api/generate/preview", {
    method: "POST",
    body: JSON.stringify({ url, voiceId }),
  });
}

interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export async function createCreditCheckout(packId: string): Promise<CheckoutResponse> {
  return fetchApi<CheckoutResponse>("/api/checkout/credits", {
    method: "POST",
    body: JSON.stringify({ packId }),
  });
}

interface CheckoutSessionStatus {
  status: string;
  credits: number | null;
  packId: string | null;
}

export async function getCheckoutSessionStatus(sessionId: string): Promise<CheckoutSessionStatus> {
  return fetchApi<CheckoutSessionStatus>(`/api/checkout/session/${sessionId}`);
}

export type { CreditBalance, CreditPreview, CheckoutResponse, CheckoutSessionStatus };

export type {
  GenerateRequest,
  GenerateResponse,
  CacheCheckResponse,
  LibraryItem,
  SubscriptionStatusResponse,
};

export { ApiError };
