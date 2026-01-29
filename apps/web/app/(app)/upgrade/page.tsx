"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Check, ArrowLeft, Ticket, Clock, Sparkles, Shield, Infinity } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createCreditCheckout } from "@/lib/api";

// Credit pack definitions — must match API CREDIT_PACKS in services/credits.ts
const CREDIT_PACKS = [
  {
    id: "coffee",
    emoji: "\u2615",
    name: "Coffee",
    credits: 15,
    price: 4.99,
    recommended: true,
    description: "Most popular choice",
  },
  {
    id: "kebab",
    emoji: "\ud83e\udd59",
    name: "Kebab",
    credits: 30,
    price: 8.99,
    description: "Great value",
  },
  {
    id: "pizza",
    emoji: "\ud83c\udf55",
    name: "Pizza",
    credits: 60,
    price: 16.99,
    description: "For regular readers",
  },
  {
    id: "feast",
    emoji: "\ud83c\udf71",
    name: "Feast",
    credits: 150,
    price: 39.99,
    best: true,
    description: "Best per-article price",
  },
];

const BENEFITS = [
  { icon: Infinity, text: "Credits never expire" },
  { icon: Shield, text: "No subscription required" },
  { icon: Clock, text: "Short articles bank leftover time" },
  { icon: Check, text: "7-day money back guarantee" },
];

export default function UpgradePage() {
  const { user } = useAuth();
  const { credits, timeBank, isLoading: creditsLoading } = useCredits();
  const router = useRouter();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (packId: string) => {
    if (!user) {
      router.push("/login?redirect=/upgrade");
      return;
    }

    setPurchasing(packId);
    setError(null);

    try {
      const { checkoutUrl } = await createCreditCheckout(packId);
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Checkout failed:", err);
      setError("Failed to start checkout. Please try again.");
      setPurchasing(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <button
        onClick={() => router.back()}
        className="mb-12 flex items-center gap-2 font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--foreground)]">
          <Sparkles className="h-4 w-4" />
          Article Credits
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Turn Articles Into Podcasts
        </h1>
        <p className="mt-2 font-normal leading-relaxed text-[var(--muted)]">
          1 credit = 1 article. No subscription. Pay as you go.
        </p>
      </div>

      {/* Current Balance */}
      {user && (
        <div className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-[var(--muted)]" />
              <div>
                <p className="font-bold text-[var(--foreground)]">
                  {creditsLoading ? "..." : `${credits} credits`}
                </p>
                {timeBank > 0 && (
                  <p className="text-sm font-normal text-[var(--muted)]">
                    +{timeBank} min banked
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-lg border border-[var(--destructive)] bg-[var(--card)] p-4 text-sm text-[var(--destructive)]">
          {error}
        </div>
      )}

      {/* Credit Packs Grid */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`relative rounded-2xl border p-6 transition-all ${
              pack.recommended || pack.best
                ? "border-[var(--foreground)] bg-[var(--card)]"
                : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--foreground)]"
            }`}
          >
            {pack.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-[var(--foreground)] px-3 py-1 text-xs font-bold text-[var(--background)]">
                  Popular
                </span>
              </div>
            )}
            {pack.best && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-[var(--foreground)] px-3 py-1 text-xs font-bold text-[var(--background)]">
                  Best Value
                </span>
              </div>
            )}

            <div className="text-center">
              <span className="text-4xl">{pack.emoji}</span>
              <h3 className="mt-2 text-lg font-bold text-[var(--foreground)]">
                {pack.name}
              </h3>
              <p className="text-sm font-normal text-[var(--muted)]">{pack.description}</p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                ${pack.price.toFixed(2)}
              </p>
              <p className="text-sm font-normal text-[var(--muted)]">
                {pack.credits} articles
              </p>
              <p className="mt-1 text-xs font-normal text-[var(--muted)]">
                ${(pack.price / pack.credits).toFixed(2)}/article
              </p>
            </div>

            <button
              onClick={() => handlePurchase(pack.id)}
              disabled={purchasing !== null}
              className={`mt-6 w-full rounded-xl border border-transparent py-3 font-bold transition-colors bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--background)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] disabled:opacity-50 ${purchasing === pack.id ? "cursor-wait" : ""}`}
            >
              {purchasing === pack.id ? "Redirecting..." : "Buy Now"}
            </button>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div className="mt-12 rounded-2xl bg-[var(--card)] p-6">
        <h2 className="mb-6 text-center text-lg font-bold text-[var(--foreground)]">
          Why credits?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {BENEFITS.map((benefit, i) => (
            <div key={i} className="flex items-center gap-3">
              <benefit.icon className="h-5 w-5 flex-shrink-0 text-[var(--muted)]" />
              <span className="font-normal text-[var(--foreground)]">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="mt-12 rounded-xl bg-[var(--card)] p-6">
        <h3 className="mb-6 text-center font-bold text-[var(--foreground)]">
          How credits work
        </h3>
        <ul className="space-y-3 text-sm font-normal text-[var(--muted)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--foreground)]">1.</span>
            <span>1 credit = 1 article (most articles under 20 min)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--foreground)]">2.</span>
            <span>Long articles (20+ min) may use extra credits</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--foreground)]">3.</span>
            <span>Short articles? Unused time saves for later</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--foreground)]">4.</span>
            <span>You always see the cost before converting</span>
          </li>
        </ul>
      </div>

      {/* Not signed in prompt */}
      {!user && (
        <div className="mt-12 rounded-xl bg-[var(--card)] p-6 text-center">
          <p className="font-normal text-[var(--muted)]">
            <Link href="/login?redirect=/upgrade" className="font-medium text-[var(--foreground)] underline hover:no-underline">
              Sign in
            </Link>
            {" "}to purchase credits and start converting articles.
          </p>
        </div>
      )}
    </div>
  );
}
