import { Check } from "lucide-react";
import Link from "next/link";

const packs = [
  {
    name: "Starter",
    credits: 5,
    price: "$4.99",
    pricePerArticle: "$1.00",
    description: "Try it out",
    highlighted: false,
  },
  {
    name: "Regular",
    credits: 15,
    price: "$9.99",
    pricePerArticle: "$0.67",
    description: "Best value for casual listeners",
    highlighted: true,
  },
  {
    name: "Power",
    credits: 50,
    price: "$24.99",
    pricePerArticle: "$0.50",
    description: "For power users",
    highlighted: false,
  },
];

const features = [
  "All AI voices included",
  "Credits never expire",
  "Personal audio library",
  "Background playback",
  "Speed control",
  "Cache hits are free",
  "Time bank for leftover minutes",
  "7-day money-back guarantee",
];

export function Pricing() {
  return (
    <section className="bg-black py-24" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Simple Credit Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            1 credit = 1 article. Buy what you need, no subscription required.
          </p>
        </div>

        {/* Credit Packs */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {packs.map((pack) => (
            <div
              key={pack.name}
              className={`relative rounded-2xl border p-8 ${
                pack.highlighted
                  ? "border-amber-500 bg-gradient-to-b from-amber-500/5 to-transparent shadow-xl"
                  : "border-zinc-800 bg-zinc-900"
              }`}
            >
              {pack.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1 text-sm font-medium text-black">
                  Best Value
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">
                  {pack.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {pack.description}
                </p>
              </div>

              <div className="mb-2">
                <span className="text-4xl font-bold text-white">
                  {pack.price}
                </span>
              </div>
              <p className="mb-6 text-sm text-zinc-400">
                {pack.credits} credits ({pack.pricePerArticle}/article)
              </p>

              <Link
                href="/login?redirect=/upgrade"
                className={`block w-full rounded-xl py-4 text-center font-semibold transition-all ${
                  pack.highlighted
                    ? "bg-amber-500 text-black hover:bg-amber-400"
                    : "border-2 border-white text-white hover:bg-white hover:text-black"
                }`}
              >
                Buy {pack.credits} Credits
              </Link>
            </div>
          ))}
        </div>

        {/* All Features */}
        <div className="mx-auto mt-16 max-w-2xl">
          <h3 className="mb-6 text-center text-lg font-semibold text-white">
            Every credit includes
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-amber-500" />
                <span className="text-white">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Money Back */}
        <p className="mt-8 text-center text-sm text-zinc-400">
          7-day money-back guarantee. Payments processed securely via Stripe.
        </p>
      </div>
    </section>
  );
}
