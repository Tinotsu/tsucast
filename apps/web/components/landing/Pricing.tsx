import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try tsucast and see the magic",
    features: [
      "3 articles per day",
      "All AI voices",
      "Personal library",
      "Background playback",
      "Speed control",
    ],
    cta: "Download Free",
    ctaLink: "https://apps.apple.com/app/tsucast",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "Unlimited listening for power users",
    features: [
      "Unlimited articles",
      "All premium voices",
      "Priority processing",
      "Early access to features",
      "Priority support",
    ],
    cta: "Start Pro",
    ctaLink: "https://apps.apple.com/app/tsucast",
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section className="bg-black py-24" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Start for free, upgrade when you need more. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-8 lg:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-amber-500 bg-gradient-to-b from-amber-500/5 to-transparent shadow-xl"
                  : "border-zinc-800 bg-zinc-900"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1 text-sm font-medium text-black">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-zinc-400">
                  {plan.period}
                </span>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-amber-500" />
                    <span className="text-white">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaLink}
                className={`block w-full rounded-xl py-4 text-center font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-amber-500 text-black hover:bg-amber-400"
                    : "border-2 border-white text-white hover:bg-white hover:text-black"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Money Back */}
        <p className="mt-8 text-center text-sm text-zinc-400">
          Cancel anytime. Subscription managed through App Store.
        </p>
      </div>
    </section>
  );
}
