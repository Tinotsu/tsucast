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
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#e5e5e5] border-t-[#1a1a1a]" />
          <p className="mt-4 font-normal text-[#737373]">Confirming your purchase...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500">
          <span className="text-2xl text-white" aria-hidden="true">&#x26A0;</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">Something went wrong</h1>
        <p className="mt-2 font-normal leading-relaxed text-[#737373]">
          We couldn&apos;t confirm your purchase. If you were charged, your credits will be added shortly.
        </p>
        <Link
          href="/upgrade"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-6 py-3 font-bold text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
        >
          Back to Credits
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {/* Success Icon */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
        <Check className="h-10 w-10 text-white" />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Purchase Complete!</h1>

      {purchasedCredits && (
        <div className="mt-8 rounded-2xl bg-white p-6">
          <div className="flex items-center justify-center gap-3">
            <Ticket className="h-8 w-8 text-[#737373]" />
            <span className="text-4xl font-bold text-[#1a1a1a]">+{purchasedCredits}</span>
            <span className="text-lg font-normal text-[#737373]">credits</span>
          </div>
        </div>
      )}

      {/* New Balance */}
      <div className="mt-6 rounded-xl border border-[#e5e5e5] bg-white p-4">
        <p className="text-sm font-medium text-[#737373]">Your new balance</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-[#1a1a1a]">
          {creditsLoading ? "..." : `${credits} credits`}
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8 space-y-4">
        <Link
          href="/dashboard"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1a1a] py-4 font-bold text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
        >
          <Sparkles className="h-5 w-5" />
          Start Converting Articles
          <ArrowRight className="h-5 w-5" />
        </Link>

        <Link
          href="/library"
          className="block font-medium text-[#737373] underline hover:text-[#1a1a1a] hover:no-underline"
        >
          View Library
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#e5e5e5] border-t-[#1a1a1a]" />
        <p className="mt-4 font-normal text-[#737373]">Loading...</p>
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
