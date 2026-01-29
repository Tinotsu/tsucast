"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import {
  User,
  Mail,
  Ticket,
  LogOut,
  ExternalLink,
  Loader2,
  Trash2,
  AlertTriangle,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";
import { useState, useEffect } from "react";
import { deleteAccount } from "@/lib/api";

export default function SettingsPage() {
  const { profile, signOut, isLoading, isAuthenticated } = useAuth();
  const { credits, timeBank, isLoading: creditsLoading } = useCredits();
  const { theme, setTheme } = useTheme();
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
        <Loader2 className="h-8 w-8 animate-spin text-[var(--foreground)]" />
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
      <h1 className="mb-12 text-3xl font-bold tracking-tight text-[var(--foreground)]">
        Settings
      </h1>

      {/* Profile Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">
          Profile
        </h2>
        <div className="rounded-2xl bg-[var(--card)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--foreground)]">
              <User className="h-8 w-8 text-[var(--background)]" />
            </div>
            <div>
              <p className="font-bold text-[var(--foreground)]">
                {profile?.display_name || profile?.email?.split("@")[0]}
              </p>
              <p className="flex items-center gap-2 text-sm font-normal text-[var(--muted)]">
                <Mail className="h-4 w-4" />
                {profile?.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credits Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">
          Credits
        </h2>
        <div className="rounded-2xl bg-[var(--card)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--foreground)]">
                <Ticket className="h-5 w-5 text-[var(--background)]" />
              </div>
              <div>
                <p className="font-bold text-[var(--foreground)]">
                  {creditsLoading ? "..." : `${credits} credits available`}
                </p>
                {timeBank > 0 && (
                  <p className="text-sm font-normal text-[var(--muted)]">
                    {timeBank} min banked
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/upgrade"
              className="rounded-lg bg-[var(--foreground)] px-4 py-2 font-bold text-[var(--background)] transition-colors hover:opacity-80"
            >
              Buy more credits
            </Link>
          </div>
        </div>
      </section>

      {/* Theme Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">
          Appearance
        </h2>
        <div className="rounded-2xl bg-[var(--card)] p-6">
          <p className="mb-4 text-sm text-[var(--muted)]">
            Choose your preferred theme
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-colors ${
                theme === "light"
                  ? "border-[var(--foreground)] bg-[var(--secondary)]"
                  : "border-[var(--border)] hover:border-[var(--muted)]"
              }`}
            >
              <Sun className="h-6 w-6" />
              <span className="text-sm font-medium">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-colors ${
                theme === "dark"
                  ? "border-[var(--foreground)] bg-[var(--secondary)]"
                  : "border-[var(--border)] hover:border-[var(--muted)]"
              }`}
            >
              <Moon className="h-6 w-6" />
              <span className="text-sm font-medium">Dark</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-colors ${
                theme === "system"
                  ? "border-[var(--foreground)] bg-[var(--secondary)]"
                  : "border-[var(--border)] hover:border-[var(--muted)]"
              }`}
            >
              <Monitor className="h-6 w-6" />
              <span className="text-sm font-medium">System</span>
            </button>
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">
          Account
        </h2>
        <div className="rounded-2xl bg-[var(--card)]">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex w-full items-center justify-between border-b border-[var(--border)] px-6 py-4 text-left text-[var(--foreground)] transition-colors hover:bg-[var(--foreground)] hover:text-[var(--background)]"
          >
            <span className="flex items-center gap-3 font-bold">
              <LogOut className="h-5 w-5" />
              Sign out
            </span>
            {isSigningOut && <Loader2 className="h-5 w-5 animate-spin" />}
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex w-full items-center justify-between px-6 py-4 text-left text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)] hover:text-white"
          >
            <span className="flex items-center gap-3 font-bold">
              <Trash2 className="h-5 w-5" />
              Delete account
            </span>
          </button>
        </div>
      </section>

      {/* Legal Links */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">
          Legal
        </h2>
        <div className="rounded-2xl bg-[var(--card)]">
          <Link
            href="/privacy"
            className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--foreground)] hover:text-[var(--background)]"
          >
            Privacy Policy
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link
            href="/terms"
            className="flex items-center justify-between px-6 py-4 font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--foreground)] hover:text-[var(--background)]"
          >
            Terms of Service
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* App Version */}
      <p className="mt-12 text-center text-xs font-normal text-[var(--muted)]">
        tsucast Web v1.0.0
      </p>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--destructive)]">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  Delete Account
                </h3>
              </div>
              <button
                onClick={closeDeleteDialog}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 space-y-3 text-sm font-normal text-[var(--muted)]">
              <p>
                This action <span className="text-[var(--destructive)]">cannot be undone</span>.
                All your data will be permanently deleted, including:
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Generated podcasts</li>
                <li>Library items and playlists</li>
                <li>Playback history and progress</li>
                <li>Account information</li>
              </ul>
              <p className="pt-2">
                To confirm, type <span className="font-mono text-[var(--foreground)]">DELETE</span> below:
              </p>
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 py-3 font-normal text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--destructive)] focus:outline-none focus:ring-1 focus:ring-[var(--destructive)]"
              disabled={isDeleting}
            />

            {deleteError && (
              <div className="mb-4 rounded-lg border border-[var(--destructive)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--destructive)]">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-[var(--foreground)] px-4 py-3 font-bold text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--destructive)] px-4 py-3 font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
