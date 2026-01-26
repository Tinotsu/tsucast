"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Ticket, ArrowRight, Sparkles } from "lucide-react";
import { getCheckoutSessionStatus } from "@/lib/api";
import { useCredits } from "@/hooks/useCredits";

function CreditSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { invalidateCredits, credits, isLoading: creditsLoading } = useCredits();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [purchasedCredits, setPurchasedCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    const checkSession = async () => {
      try {
        const session = await getCheckoutSessionStatus(sessionId);
        if (session.status === "paid") {
          setStatus("success");
          setPurchasedCredits(session.credits);
          // Refresh credit balance
          invalidateCredits();
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Failed to check session:", err);
        setStatus("error");
      }
    };

    checkSession();
  }, [sessionId, invalidateCredits]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-amber-500" />
          <p className="mt-4 text-zinc-400">Confirming your purchase...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <span className="text-2xl">&#x26A0;</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mt-2 text-zinc-400">
          We couldn&apos;t confirm your purchase. If you were charged, your credits will be added shortly.
        </p>
        <Link
          href="/upgrade"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-black hover:bg-amber-400"
        >
          Back to Credits
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {/* Success Icon */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
        <Check className="h-10 w-10 text-emerald-500" />
      </div>

      <h1 className="text-3xl font-bold text-white">Purchase Complete!</h1>

      {purchasedCredits && (
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <div className="flex items-center justify-center gap-3">
            <Ticket className="h-8 w-8 text-amber-500" />
            <span className="text-4xl font-bold text-white">+{purchasedCredits}</span>
            <span className="text-lg text-zinc-400">credits</span>
          </div>
        </div>
      )}

      {/* New Balance */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-sm text-zinc-400">Your new balance</p>
        <p className="mt-1 text-2xl font-bold text-white">
          {creditsLoading ? "..." : `${credits} credits`}
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8 space-y-4">
        <Link
          href="/generate"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 font-semibold text-black hover:bg-amber-400"
        >
          <Sparkles className="h-5 w-5" />
          Start Converting Articles
          <ArrowRight className="h-5 w-5" />
        </Link>

        <Link
          href="/dashboard"
          className="block text-zinc-400 hover:text-white"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-amber-500" />
        <p className="mt-4 text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}

export default function CreditSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CreditSuccessContent />
    </Suspense>
  );
}
