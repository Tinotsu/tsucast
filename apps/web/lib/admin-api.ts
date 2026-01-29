const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  credits_balance: number;
  time_bank_minutes: number;
  is_admin: boolean;
  created_at: string;
  last_sign_in: string | null;
  total_generations: number;
}

interface AdminMetrics {
  totalUsers: number;
  totalGenerations: number;
  generationsToday: number;
  activeUsersToday: number;
  errorRate: number;
  avgLatency: number;
}

interface ExtractionReport {
  id: string;
  url: string;
  normalized_url: string;
  error_type: string;
  error_message: string | null;
  user_id: string;
  user_email: string;
  status: "pending" | "fixed" | "wont_fix" | "duplicate";
  report_count: number;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function getAuthToken(): Promise<string | null> {
  // Read token directly from cookie to bypass the Supabase SSR client
  // initialization deadlock (supabase/supabase-js#1594).
  // The API server re-validates the token on every request.
  const { getAccessTokenFromCookie } = await import("@/lib/auth-token");
  return getAccessTokenFromCookie();
}

async function fetchAdminApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 403) {
    throw new Error("Access denied. Admin privileges required.");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || "Request failed");
  }

  return response.json();
}

// User Management
export async function getAdminUsers(
  page = 1,
  pageSize = 20,
  search?: string
): Promise<PaginatedResponse<AdminUser>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (search) params.append("search", search);

  return fetchAdminApi(`/api/admin/users?${params}`);
}

export async function getAdminUser(userId: string): Promise<AdminUser> {
  return fetchAdminApi(`/api/admin/users/${userId}`);
}

// Metrics
export async function getAdminMetrics(): Promise<AdminMetrics> {
  return fetchAdminApi("/api/admin/metrics");
}

// Reports
export async function getExtractionReports(
  page = 1,
  pageSize = 20,
  status?: string
): Promise<PaginatedResponse<ExtractionReport>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (status) params.append("status", status);

  return fetchAdminApi(`/api/admin/reports?${params}`);
}

export async function updateReportStatus(
  reportId: string,
  status: "fixed" | "wont_fix" | "duplicate"
): Promise<void> {
  await fetchAdminApi(`/api/admin/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// Free Content
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

export async function getAdminFreeContent(): Promise<{
  items: FreeContentItem[];
}> {
  return fetchAdminApi("/api/free-content/admin");
}

export async function createAdminFreeContent(data: {
  title: string;
  text?: string;
  url?: string;
  voiceId?: string;
}): Promise<{ item: FreeContentItem }> {
  return fetchAdminApi("/api/free-content/admin", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdminFreeContent(
  id: string,
  data: { title: string }
): Promise<{ item: FreeContentItem }> {
  return fetchAdminApi(`/api/free-content/admin/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminFreeContent(
  id: string
): Promise<{ success: boolean }> {
  return fetchAdminApi(`/api/free-content/admin/${id}`, {
    method: "DELETE",
  });
}

export type {
  AdminUser,
  AdminMetrics,
  ExtractionReport,
  PaginatedResponse,
};
