"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Mail,
  Crown,
  LogOut,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { profile, isPro, signOut, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/settings");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth or if not authenticated (redirect in progress)
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-white">
        Settings
      </h1>

      {/* Profile Section */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Profile
        </h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <User className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-white">
                {profile?.display_name || profile?.email?.split("@")[0]}
              </p>
              <p className="flex items-center gap-2 text-sm text-zinc-400">
                <Mail className="h-4 w-4" />
                {profile?.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Subscription
        </h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isPro
                    ? "bg-amber-500"
                    : "bg-amber-500/10"
                }`}
              >
                <Crown
                  className={`h-5 w-5 ${isPro ? "text-black" : "text-amber-500"}`}
                />
              </div>
              <div>
                <p className="font-semibold text-white">
                  {isPro ? "Pro Plan" : "Free Plan"}
                </p>
                <p className="text-sm text-zinc-400">
                  {isPro
                    ? "Unlimited generations"
                    : `${3 - (profile?.daily_generations || 0)} of 3 generations left today`}
                </p>
              </div>
            </div>
            {!isPro && (
              <Link
                href="/upgrade"
                className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-black hover:bg-amber-400"
              >
                Upgrade
              </Link>
            )}
          </div>

          {isPro && (
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="mb-2 text-sm text-zinc-400">
                Manage your subscription through your app store:
              </p>
              <div className="flex gap-3">
                <a
                  href="https://apps.apple.com/account/subscriptions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  App Store
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href="https://play.google.com/store/account/subscriptions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Google Play
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Account Section */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Account
        </h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex w-full items-center justify-between px-6 py-4 text-left text-red-500 transition-colors hover:bg-red-500/10"
          >
            <span className="flex items-center gap-3">
              <LogOut className="h-5 w-5" />
              Sign out
            </span>
            {isSigningOut && <Loader2 className="h-5 w-5 animate-spin" />}
          </button>
        </div>
      </section>

      {/* Legal Links */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Legal
        </h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
          <Link
            href="/privacy"
            className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 text-white transition-colors hover:bg-zinc-800"
          >
            Privacy Policy
            <ExternalLink className="h-4 w-4 text-zinc-400" />
          </Link>
          <Link
            href="/terms"
            className="flex items-center justify-between px-6 py-4 text-white transition-colors hover:bg-zinc-800"
          >
            Terms of Service
            <ExternalLink className="h-4 w-4 text-zinc-400" />
          </Link>
        </div>
      </section>

      {/* App Version */}
      <p className="mt-8 text-center text-xs text-zinc-500">
        tsucast Web v1.0.0
      </p>
    </div>
  );
}
