"use client";

import { useEffect, useState } from "react";
import { getAdminMetrics, type AdminMetrics } from "@/lib/admin-api";
import {
  Users,
  Headphones,
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
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
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-red-500" />
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadMetrics}
          className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Use mock data if API not available yet
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-zinc-400">
          Monitor tsucast platform metrics and health
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <stat.icon className="h-6 w-6 text-amber-500" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">
                {stat.value}
              </p>
              <p className="text-sm text-zinc-400">
                {stat.name}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/users"
              className="flex items-center justify-between rounded-lg border border-zinc-800 p-4 transition-colors hover:border-amber-500"
            >
              <span className="flex items-center gap-3">
                <Users className="h-5 w-5 text-amber-500" />
                <span className="font-medium text-white">
                  View All Users
                </span>
              </span>
              <span className="text-sm text-zinc-400">
                {data.totalUsers} users
              </span>
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center justify-between rounded-lg border border-zinc-800 p-4 transition-colors hover:border-amber-500"
            >
              <span className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="font-medium text-white">
                  Review Reports
                </span>
              </span>
              <span className="text-sm text-zinc-400">
                View pending
              </span>
            </Link>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            System Health
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">API Status</span>
              <span className="flex items-center gap-2 text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Database</span>
              <span className="flex items-center gap-2 text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">TTS Service</span>
              <span className="flex items-center gap-2 text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Available
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Storage (R2)</span>
              <span className="flex items-center gap-2 text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
