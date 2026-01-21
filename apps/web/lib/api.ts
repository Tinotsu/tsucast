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
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      // Ignore AbortError - happens during fast navigation/remounts
      if (error.name !== "AbortError" && error.message !== "signal is aborted without reason") {
        console.error("Failed to get session:", error);
      }
      return null;
    }
    return data.session?.access_token || null;
  } catch (err) {
    // Ignore AbortError - happens during fast navigation/remounts
    if (err instanceof Error && (err.name === "AbortError" || err.message === "signal is aborted without reason")) {
      return null;
    }
    console.error("Error getting auth token:", err);
    return null;
  }
}

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

export async function generateAudio(
  request: GenerateRequest
): Promise<GenerateResponse> {
  return fetchApi<GenerateResponse>("/api/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getLimitStatus(): Promise<LimitStatusResponse> {
  return fetchApi<LimitStatusResponse>("/api/user/limit");
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

export type {
  GenerateRequest,
  GenerateResponse,
  CacheCheckResponse,
  LimitStatusResponse,
  LibraryItem,
};

export { ApiError };
