"use client";

import { useEffect, useState, useCallback } from "react";
import { getAdminMetrics, type AdminMetrics } from "@/lib/admin-api";
import {
  Users,
  Headphones,
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface HealthResponse {
  status: "ok" | "degraded";
  services?: {
    database: "healthy" | "unhealthy" | "unknown";
    storage: "healthy" | "unhealthy" | "unknown";
    tts: "healthy" | "unhealthy" | "unknown";
  };
}

type ServiceStatus = "healthy" | "unhealthy" | "unknown" | "loading";

const statusDisplay: Record<
  ServiceStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  healthy: {
    label: "Healthy",
    dotClass: "bg-green-500",
    textClass: "text-green-500",
  },
  unhealthy: {
    label: "Unhealthy",
    dotClass: "bg-red-500",
    textClass: "text-red-500",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-yellow-500",
    textClass: "text-yellow-500",
  },
  loading: {
    label: "Checking...",
    dotClass: "bg-gray-300",
    textClass: "text-[#737373]",
  },
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [health, setHealth] = useState<{
    api: ServiceStatus;
    database: ServiceStatus;
    tts: ServiceStatus;
    storage: ServiceStatus;
  }>({
    api: "loading",
    database: "loading",
    tts: "loading",
    storage: "loading",
  });

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    setHealth({ api: "loading", database: "loading", tts: "loading", storage: "loading" });
    try {
      const response = await fetch(`${API_URL}/health`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        setHealth({ api: "unhealthy", database: "unknown", tts: "unknown", storage: "unknown" });
        return;
      }
      const data: HealthResponse = await response.json();
      setHealth({
        api: data.status === "ok" ? "healthy" : "unhealthy",
        database: data.services?.database ?? "unknown",
        tts: data.services?.tts ?? "unknown",
        storage: data.services?.storage ?? "unknown",
      });
    } catch {
      setHealth({ api: "unhealthy", database: "unknown", tts: "unknown", storage: "unknown" });
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    loadHealth();
  }, [loadMetrics, loadHealth]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500 bg-red-500 p-6 text-center">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-white" />
        <p className="text-white">{error}</p>
        <button
          onClick={loadMetrics}
          className="mt-4 rounded-lg bg-[#1a1a1a] px-4 py-2 font-bold text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
        >
          Retry
        </button>
      </div>
    );
  }

  const data = metrics || {
    totalUsers: 0,
    totalGenerations: 0,
    generationsToday: 0,
    activeUsersToday: 0,
    errorRate: 0,
    avgLatency: 0,
  };

  const stats = [
    {
      name: "Total Users",
      value: data.totalUsers.toLocaleString(),
      icon: Users,
    },
    {
      name: "Total Generations",
      value: data.totalGenerations.toLocaleString(),
      icon: Headphones,
    },
    {
      name: "Generations Today",
      value: data.generationsToday.toLocaleString(),
      icon: TrendingUp,
    },
    {
      name: "Active Today",
      value: data.activeUsersToday.toLocaleString(),
      icon: Activity,
    },
    {
      name: "Avg Latency",
      value: `${data.avgLatency}ms`,
      icon: Clock,
    },
  ];

  const healthServices = [
    { name: "API Status", status: health.api },
    { name: "Database", status: health.database },
    { name: "TTS Service", status: health.tts },
    { name: "Storage (R2)", status: health.storage },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
          Admin Dashboard
        </h1>
        <p className="mt-2 font-normal leading-relaxed text-[#737373]">
          Monitor tsucast platform metrics and health
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-2xl border border-[#e5e5e5] bg-white p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a1a1a]">
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-[#1a1a1a]">
                {stat.value}
              </p>
              <p className="text-sm font-normal text-[#737373]">
                {stat.name}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-[#1a1a1a]">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/users"
              className="flex items-center justify-between rounded-lg border border-[#e5e5e5] p-4 transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <span className="font-medium">
                  View All Users
                </span>
              </span>
              <span className="text-sm font-normal text-[#737373]">
                {data.totalUsers} users
              </span>
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center justify-between rounded-lg border border-[#e5e5e5] p-4 transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <span className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  Review Reports
                </span>
              </span>
              <span className="text-sm font-normal text-[#737373]">
                View pending
              </span>
            </Link>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1a1a1a]">
              System Health
            </h2>
            <button
              onClick={loadHealth}
              className="rounded-lg p-1.5 text-[#737373] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
              title="Refresh health checks"
            >
              <RefreshCw className={cn("h-4 w-4", health.api === "loading" && "animate-spin")} />
            </button>
          </div>
          <div className="space-y-4">
            {healthServices.map((service) => {
              const display = statusDisplay[service.status];
              return (
                <div
                  key={service.name}
                  className="flex items-center justify-between"
                >
                  <span className="font-normal text-[#1a1a1a]">
                    {service.name}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-2",
                      display.textClass
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        display.dotClass
                      )}
                    />
                    {display.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
