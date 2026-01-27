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
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { deleteAccount } from "@/lib/api";

export default function SettingsPage() {
  const { profile, signOut, isLoading, isAuthenticated } = useAuth();
  const { credits, timeBank, isLoading: creditsLoading } = useCredits();
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
        <Loader2 className="h-8 w-8 animate-spin text-[#1a1a1a]" />
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
      <h1 className="mb-12 text-3xl font-bold tracking-tight text-[#1a1a1a]">
        Settings
      </h1>

      {/* Profile Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-[#1a1a1a]">
          Profile
        </h2>
        <div className="rounded-2xl bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1a1a]">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-[#1a1a1a]">
                {profile?.display_name || profile?.email?.split("@")[0]}
              </p>
              <p className="flex items-center gap-2 text-sm font-normal text-[#737373]">
                <Mail className="h-4 w-4" />
                {profile?.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credits Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-[#1a1a1a]">
          Credits
        </h2>
        <div className="rounded-2xl bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a]">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-[#1a1a1a]">
                  {creditsLoading ? "..." : `${credits} credits available`}
                </p>
                {timeBank > 0 && (
                  <p className="text-sm font-normal text-[#737373]">
                    {timeBank} min banked
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/upgrade"
              className="rounded-lg bg-[#1a1a1a] px-4 py-2 font-bold text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
            >
              Buy more credits
            </Link>
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-[#1a1a1a]">
          Account
        </h2>
        <div className="rounded-2xl bg-white">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex w-full items-center justify-between border-b border-[#e5e5e5] px-6 py-4 text-left text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <span className="flex items-center gap-3 font-bold">
              <LogOut className="h-5 w-5" />
              Sign out
            </span>
            {isSigningOut && <Loader2 className="h-5 w-5 animate-spin" />}
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex w-full items-center justify-between px-6 py-4 text-left text-red-500 transition-colors hover:bg-red-500 hover:text-white"
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
        <h2 className="mb-4 text-lg font-bold text-[#1a1a1a]">
          Legal
        </h2>
        <div className="rounded-2xl bg-white">
          <Link
            href="/privacy"
            className="flex items-center justify-between border-b border-[#e5e5e5] px-6 py-4 font-medium text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            Privacy Policy
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link
            href="/terms"
            className="flex items-center justify-between px-6 py-4 font-medium text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            Terms of Service
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* App Version */}
      <p className="mt-12 text-center text-xs font-normal text-[#737373]">
        tsucast Web v1.0.0
      </p>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#e5e5e5] bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#1a1a1a]">
                  Delete Account
                </h3>
              </div>
              <button
                onClick={closeDeleteDialog}
                className="rounded-lg p-1 text-[#737373] hover:bg-[#1a1a1a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 space-y-3 text-sm font-normal text-[#737373]">
              <p>
                This action <span className="text-red-500">cannot be undone</span>.
                All your data will be permanently deleted, including:
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Generated podcasts</li>
                <li>Library items and playlists</li>
                <li>Playback history and progress</li>
                <li>Account information</li>
              </ul>
              <p className="pt-2">
                To confirm, type <span className="font-mono text-[#1a1a1a]">DELETE</span> below:
              </p>
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="mb-4 w-full rounded-lg border border-[#e5e5e5] bg-white px-4 py-3 font-normal text-[#1a1a1a] placeholder:text-[#a3a3a3] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              disabled={isDeleting}
            />

            {deleteError && (
              <div className="mb-4 rounded-lg border border-red-500 bg-white px-4 py-3 text-sm text-red-500">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-[#1a1a1a] px-4 py-3 font-bold text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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
