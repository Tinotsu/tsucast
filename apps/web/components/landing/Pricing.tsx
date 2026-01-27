import { Check } from "lucide-react";
import Link from "next/link";

const packs = [
  {
    emoji: "\u2615",
    name: "Coffee",
    credits: 15,
    price: "$4.99",
    pricePerArticle: "$0.33",
    description: "Most popular choice",
    highlighted: true,
  },
  {
    emoji: "\ud83e\udd59",
    name: "Kebab",
    credits: 30,
    price: "$8.99",
    pricePerArticle: "$0.30",
    description: "Great value",
    highlighted: false,
  },
  {
    emoji: "\ud83c\udf55",
    name: "Pizza",
    credits: 60,
    price: "$16.99",
    pricePerArticle: "$0.28",
    description: "For regular readers",
    highlighted: false,
  },
  {
    emoji: "\ud83c\udf71",
    name: "Feast",
    credits: 150,
    price: "$39.99",
    pricePerArticle: "$0.27",
    description: "Best per-article price",
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
    <section className="bg-white py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl">
            Simple Credit Pricing
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#737373]">
            1 credit = 1 article. Buy what you need, no subscription required.
          </p>
        </div>

        {/* Credit Packs */}
        <div className="mx-auto mt-20 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {packs.map((pack) => (
            <div
              key={pack.name}
              className={`relative rounded-2xl p-8 ${
                pack.highlighted
                  ? "bg-white ring-2 ring-black"
                  : "bg-white"
              }`}
            >
              {pack.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-1 text-sm font-bold text-white">
                  Popular
                </div>
              )}

              <div className="mb-6">
                <span className="text-4xl">{pack.emoji}</span>
                <h3 className="mt-3 text-xl font-bold text-[#1a1a1a]">
                  {pack.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#737373]">
                  {pack.description}
                </p>
              </div>

              <div className="mb-2">
                <span className="text-4xl font-bold text-[#1a1a1a]">
                  {pack.price}
                </span>
              </div>
              <p className="mb-8 text-sm text-[#737373]">
                {pack.credits} credits ({pack.pricePerArticle}/article)
              </p>

              <Link
                href="/login?redirect=/upgrade"
                className={`block w-full rounded-xl py-4 text-center font-bold transition-all ${
                  pack.highlighted
                    ? "bg-black text-white hover:bg-[#1a1a1a]"
                    : "border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
                }`}
              >
                Buy {pack.credits} Credits
              </Link>
            </div>
          ))}
        </div>

        {/* All Features */}
        <div className="mx-auto mt-20 max-w-2xl">
          <h3 className="mb-8 text-center text-lg font-bold text-[#1a1a1a]">
            Every credit includes
          </h3>
          <ul className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-[#1a1a1a]" />
                <span className="text-[#737373]">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Money Back */}
        <p className="mt-10 text-center text-sm text-[#737373]">
          7-day money-back guarantee. Payments processed securely via Stripe.
        </p>
      </div>
    </section>
  );
}
