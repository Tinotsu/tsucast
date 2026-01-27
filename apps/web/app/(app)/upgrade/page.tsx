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
    credits: 5,
    price: 4.99,
    recommended: true,
    description: "Most popular choice",
  },
  {
    id: "kebab",
    emoji: "\ud83e\udd59",
    name: "Kebab",
    credits: 10,
    price: 8.99,
    description: "Great value",
  },
  {
    id: "pizza",
    emoji: "\ud83c\udf55",
    name: "Pizza",
    credits: 20,
    price: 16.99,
    description: "For regular readers",
  },
  {
    id: "feast",
    emoji: "\ud83c\udf71",
    name: "Feast",
    credits: 50,
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => router.back()}
        className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-amber-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-500">
          <Sparkles className="h-4 w-4" />
          Article Credits
        </div>
        <h1 className="text-3xl font-bold text-white">
          Turn Articles Into Podcasts
        </h1>
        <p className="mt-2 text-zinc-400">
          1 credit = 1 article. No subscription. Pay as you go.
        </p>
      </div>

      {/* Current Balance */}
      {user && (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-white">
                  {creditsLoading ? "..." : `${credits} credits`}
                </p>
                {timeBank > 0 && (
                  <p className="text-sm text-zinc-400">
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
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Credit Packs Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`relative rounded-2xl border p-6 transition-all ${
              pack.recommended
                ? "border-amber-500 bg-gradient-to-b from-amber-500/10 to-transparent"
                : pack.best
                ? "border-emerald-500 bg-gradient-to-b from-emerald-500/10 to-transparent"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
            }`}
          >
            {pack.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-black">
                  Popular
                </span>
              </div>
            )}
            {pack.best && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-black">
                  Best Value
                </span>
              </div>
            )}

            <div className="text-center">
              <span className="text-4xl">{pack.emoji}</span>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {pack.name}
              </h3>
              <p className="text-sm text-zinc-400">{pack.description}</p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-3xl font-bold text-white">
                ${pack.price.toFixed(2)}
              </p>
              <p className="text-sm text-zinc-400">
                {pack.credits} articles
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                ${(pack.price / pack.credits).toFixed(2)}/article
              </p>
            </div>

            <button
              onClick={() => handlePurchase(pack.id)}
              disabled={purchasing !== null}
              className={`mt-6 w-full rounded-xl py-3 font-semibold transition-colors ${
                pack.recommended
                  ? "bg-amber-500 text-black hover:bg-amber-400 disabled:bg-amber-500/50"
                  : pack.best
                  ? "bg-emerald-500 text-black hover:bg-emerald-400 disabled:bg-emerald-500/50"
                  : "bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-600"
              } ${purchasing === pack.id ? "cursor-wait" : ""}`}
            >
              {purchasing === pack.id ? "Redirecting..." : "Buy Now"}
            </button>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-center text-lg font-semibold text-white">
          Why credits?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((benefit, i) => (
            <div key={i} className="flex items-center gap-3">
              <benefit.icon className="h-5 w-5 flex-shrink-0 text-amber-500" />
              <span className="text-white">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 text-center font-semibold text-white">
          How credits work
        </h3>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-amber-500">1.</span>
            <span>1 credit = 1 article (most articles under 20 min)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">2.</span>
            <span>Long articles (20+ min) may use extra credits</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">3.</span>
            <span>Short articles? Unused time saves for later</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">4.</span>
            <span>You always see the cost before converting</span>
          </li>
        </ul>
      </div>

      {/* Not signed in prompt */}
      {!user && (
        <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
          <p className="text-white">
            <Link href="/login?redirect=/upgrade" className="font-semibold text-amber-500 hover:text-amber-400">
              Sign in
            </Link>
            {" "}to purchase credits and start converting articles.
          </p>
        </div>
      )}
    </div>
  );
}
