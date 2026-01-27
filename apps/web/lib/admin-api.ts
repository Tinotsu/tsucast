const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
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

export type {
  AdminUser,
  AdminMetrics,
  ExtractionReport,
  PaginatedResponse,
};
