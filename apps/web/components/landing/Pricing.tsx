import { Check } from "lucide-react";
import Link from "next/link";

const packs = [
  {
    id: "coffee",
    emoji: "\u2615",
    name: "Coffee",
    credits: 15,
    price: "$4.99",
    pricePerArticle: "$0.33",
    description: "Try it out",
    highlighted: false,
    badge: null,
  },
  {
    id: "kebab",
    emoji: "\ud83e\udd59",
    name: "Kebab",
    credits: 30,
    price: "$8.99",
    pricePerArticle: "$0.30",
    description: "Most popular choice",
    highlighted: true,
    badge: "Popular",
  },
  {
    id: "pizza",
    emoji: "\ud83c\udf55",
    name: "Pizza",
    credits: 60,
    price: "$16.99",
    pricePerArticle: "$0.28",
    description: "For regular readers",
    highlighted: false,
    badge: null,
  },
  {
    id: "feast",
    emoji: "\ud83c\udf71",
    name: "Feast",
    credits: 150,
    price: "$39.99",
    pricePerArticle: "$0.27",
    description: "Best per-article price",
    highlighted: false,
    badge: "Best Value",
  },
];

const features = [
  "All AI voices included",
  "Credits never expire",
  "Personal audio library",
  "Background playback",
];

export function Pricing() {
  return (
    <section
      data-testid="pricing-section"
      className="bg-[var(--background)] py-16"
      id="pricing"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Simple Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--muted)]">
            Pay for what you use. No subscription required.
          </p>
        </div>

        {/* Credit Packs */}
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {packs.map((pack) => (
            <div
              key={pack.id}
              data-testid="pricing-card"
              data-pack={pack.id}
              className={`relative rounded-2xl border p-6 transition-all hover:-translate-y-1 ${
                pack.highlighted
                  ? "border-[var(--foreground)] ring-2 ring-[var(--foreground)]"
                  : "border-[var(--border)] hover:border-[var(--foreground)]"
              }`}
            >
              {pack.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--foreground)] px-3 py-1 text-xs font-bold text-[var(--background)]">
                  {pack.badge}
                </div>
              )}

              <div className="mb-4">
                <span className="text-4xl">{pack.emoji}</span>
                <h3 className="mt-2 text-lg font-bold text-[var(--foreground)]">
                  {pack.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {pack.description}
                </p>
              </div>

              <div className="mb-1">
                <span className="text-3xl font-bold text-[var(--foreground)]">
                  {pack.price}
                </span>
              </div>
              <p className="mb-6 text-sm text-[var(--muted)]">
                {pack.credits} credits ({pack.pricePerArticle}/article)
              </p>

              <Link
                href="/login?redirect=/upgrade"
                data-testid={`pricing-buy-${pack.id}`}
                className={`block w-full rounded-xl py-3 text-center font-bold transition-all ${
                  pack.highlighted
                    ? "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
                    : "border-2 border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                }`}
              >
                Buy {pack.credits} Credits
              </Link>
            </div>
          ))}
        </div>

        {/* All Features */}
        <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
          <h3 className="mb-8 text-center text-xl font-bold text-[var(--foreground)]">
            Every credit includes
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-xl bg-[var(--background)] px-4 py-3"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {feature}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-[var(--muted)]">
            Payments processed securely via Stripe.
          </p>
        </div>
      </div>
    </section>
  );
}
