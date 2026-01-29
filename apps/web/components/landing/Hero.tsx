import Link from "next/link";
import { Headphones } from "lucide-react";
import { HeroPlayer } from "@/components/marketing/HeroPlayer";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-medium text-[#737373]">
            <Headphones className="h-4 w-4" />
            <span>AI-Powered Article to Podcast</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-[#1a1a1a] sm:text-6xl lg:text-7xl">
            Turn Any Article Into a{" "}
            <span className="text-[#1a1a1a] underline decoration-[#e5e5e5] underline-offset-8">Podcast</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#737373] sm:text-xl">
            Paste any URL, pick a voice, and start listening in under 10
            seconds. Transform your reading list into your personal podcast
            library.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="https://apps.apple.com/app/tsucast"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-8 py-4 text-lg font-bold text-white transition-all hover:bg-[#1a1a1a]"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Download for iOS
            </Link>
            <Link
              href="https://play.google.com/store/apps/details?id=app.tsucast"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#1a1a1a] px-8 py-4 text-lg font-bold text-[#1a1a1a] transition-all hover:bg-[#1a1a1a] hover:text-white"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
              </svg>
              Get on Android
            </Link>
          </div>

        </div>

        {/* Sample Player */}
        <div className="mx-auto mt-16 max-w-3xl">
          <HeroPlayer />
        </div>
      </div>
    </section>
  );
}
