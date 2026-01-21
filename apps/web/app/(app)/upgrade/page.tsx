"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Check, Crown, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

const features = [
  "Unlimited article conversions",
  "All premium AI voices",
  "Priority processing queue",
  "Early access to new features",
  "Priority email support",
];

export default function UpgradePage() {
  const { isPro, profile } = useAuth();
  const router = useRouter();

  if (isPro) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-500 bg-amber-500/5 p-8 text-center">
          <Crown className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h1 className="text-2xl font-bold text-white">
            You&apos;re on Pro!
          </h1>
          <p className="mt-2 text-zinc-400">
            Enjoy unlimited article conversions and all premium features.
          </p>
          <div className="mt-6 space-y-3 text-left">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
                <span className="text-white">
                  {feature}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <p className="mb-4 text-sm text-zinc-400">
              Manage your subscription in your App Store or Google Play settings.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-black hover:bg-amber-400"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const remainingGenerations = 3 - (profile?.daily_generations || 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <button
        onClick={() => router.back()}
        className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-amber-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-500">
          <Sparkles className="h-4 w-4" />
          Upgrade to Pro
        </div>
        <h1 className="text-3xl font-bold text-white">
          Unlock Unlimited Listening
        </h1>
        <p className="mt-2 text-zinc-400">
          Turn any article into a podcast, anytime you want
        </p>
      </div>

      {/* Current Status */}
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              Current Plan: Free
            </p>
            <p className="text-xs text-zinc-400">
              {remainingGenerations} of 3 generations left today
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-400">
              $0/month
            </p>
          </div>
        </div>
      </div>

      {/* Pro Plan */}
      <div className="mt-6 rounded-2xl border-2 border-amber-500 bg-gradient-to-b from-amber-500/5 to-transparent p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="text-lg font-bold text-white">
                Pro
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              For power listeners
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">
              $9.99
            </p>
            <p className="text-sm text-zinc-400">/month</p>
          </div>
        </div>

        <div className="mb-8 space-y-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <Check className="h-5 w-5 flex-shrink-0 text-amber-500" />
              <span className="text-white">
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Subscribe Button - Links to App Store */}
        <div className="space-y-4">
          <a
            href="https://apps.apple.com/app/tsucast"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 font-semibold text-black transition-colors hover:bg-amber-400"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Subscribe on iOS
          </a>

          <a
            href="https://play.google.com/store/apps/details?id=app.tsucast"
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white py-4 font-semibold text-white transition-colors hover:bg-white hover:text-black"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
            </svg>
            Subscribe on Android
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Subscription billed monthly through App Store or Google Play.
          <br />
          Cancel anytime in your device settings.
        </p>
      </div>

      {/* Web Subscription Note */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-amber-500/5 p-4 text-center">
        <p className="text-sm text-zinc-400">
          <strong className="text-white">
            Web subscription coming soon!
          </strong>
          <br />
          For now, please subscribe through the mobile app.
        </p>
      </div>
    </div>
  );
}
