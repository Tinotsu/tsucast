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
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { deleteAccount } from "@/lib/api";

export default function SettingsPage() {
  const { profile, isPro, signOut, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccount();
      // Clear local auth state and redirect
      await signOut();
      router.push("/?deleted=true");
    } catch (error) {
      console.error("Delete account failed:", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to delete account. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteConfirmText("");
    setDeleteError(null);
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
            className="flex w-full items-center justify-between border-b border-zinc-800 px-6 py-4 text-left text-white transition-colors hover:bg-zinc-800"
          >
            <span className="flex items-center gap-3">
              <LogOut className="h-5 w-5" />
              Sign out
            </span>
            {isSigningOut && <Loader2 className="h-5 w-5 animate-spin" />}
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex w-full items-center justify-between px-6 py-4 text-left text-red-500 transition-colors hover:bg-red-500/10"
          >
            <span className="flex items-center gap-3">
              <Trash2 className="h-5 w-5" />
              Delete account
            </span>
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

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Delete Account
                </h3>
              </div>
              <button
                onClick={closeDeleteDialog}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 space-y-3 text-sm text-zinc-400">
              <p>
                This action <span className="font-semibold text-red-500">cannot be undone</span>.
                All your data will be permanently deleted, including:
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Generated podcasts</li>
                <li>Library items and playlists</li>
                <li>Playback history and progress</li>
                <li>Account information</li>
              </ul>
              <p className="pt-2">
                To confirm, type <span className="font-mono font-semibold text-white">DELETE</span> below:
              </p>
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="mb-4 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              disabled={isDeleting}
            />

            {deleteError && (
              <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-zinc-700 px-4 py-3 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
