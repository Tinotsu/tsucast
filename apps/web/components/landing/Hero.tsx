import Link from "next/link";
import { Headphones } from "lucide-react";
import { HeroPlayer } from "@/components/marketing/HeroPlayer";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--background)]">
      {/* Grid background with gradient fade */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          opacity: 0.4,
        }}
        aria-hidden="true"
      />

      {/* Subtle gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(74, 144, 226, 0.15) 0%, transparent 50%)",
        }}
        aria-hidden="true"
      />

      {/* Soft gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Purple orb - top left */}
        <div
          className="absolute -left-20 -top-20 h-72 w-72 animate-float-slow rounded-full opacity-20 blur-3xl dark:opacity-10"
          style={{ background: "radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)" }}
        />
        {/* Blue orb - top right */}
        <div
          className="absolute -right-16 top-10 h-64 w-64 animate-float-slow rounded-full opacity-20 blur-3xl [animation-delay:2s] dark:opacity-10"
          style={{ background: "radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)" }}
        />
        {/* Pink orb - bottom left */}
        <div
          className="absolute -bottom-10 left-1/4 h-56 w-56 animate-float-slow rounded-full opacity-15 blur-3xl [animation-delay:4s] dark:opacity-10"
          style={{ background: "radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)" }}
        />
        {/* Cyan orb - bottom right */}
        <div
          className="absolute -bottom-20 right-1/4 h-48 w-48 animate-float-slow rounded-full opacity-15 blur-3xl [animation-delay:3s] dark:opacity-10"
          style={{ background: "radial-gradient(circle, rgba(34, 211, 238, 0.4) 0%, transparent 70%)" }}
        />
      </div>

      {/* Floating sparkles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Top row */}
        <Sparkle className="absolute left-[5%] top-[8%] h-4 w-4 text-[var(--border)] animate-float [animation-delay:0s]" />
        <Sparkle className="absolute left-[15%] top-[12%] h-5 w-5 text-[var(--border)] animate-float-reverse [animation-delay:0.5s]" />
        <Sparkle className="absolute left-[28%] top-[5%] h-3 w-3 text-[var(--border)] animate-float [animation-delay:1.1s]" />
        <Sparkle className="absolute right-[25%] top-[8%] h-4 w-4 text-[var(--border)] animate-float-reverse [animation-delay:0.3s]" />
        <Sparkle className="absolute right-[12%] top-[6%] h-5 w-5 text-[var(--border)] animate-float [animation-delay:0.8s]" />
        <Sparkle className="absolute right-[3%] top-[15%] h-3 w-3 text-[var(--border)] animate-float-reverse [animation-delay:1.4s]" />

        {/* Middle row - left side */}
        <Sparkle className="absolute left-[3%] top-[35%] h-3 w-3 text-[var(--border)] animate-float [animation-delay:0.2s]" />
        <Sparkle className="absolute left-[8%] top-[50%] h-5 w-5 text-[var(--border)] animate-float-reverse [animation-delay:0.9s]" />
        <Sparkle className="absolute left-[4%] top-[65%] h-4 w-4 text-[var(--border)] animate-float [animation-delay:1.3s]" />

        {/* Middle row - right side */}
        <Sparkle className="absolute right-[5%] top-[32%] h-4 w-4 text-[var(--border)] animate-float-reverse [animation-delay:0.6s]" />
        <Sparkle className="absolute right-[3%] top-[48%] h-6 w-6 text-[var(--border)] animate-float [animation-delay:0.1s]" />
        <Sparkle className="absolute right-[7%] top-[62%] h-3 w-3 text-[var(--border)] animate-float-reverse [animation-delay:1.0s]" />

        {/* Bottom row */}
        <Sparkle className="absolute bottom-[15%] left-[6%] h-4 w-4 text-[var(--border)] animate-float [animation-delay:0.7s]" />
        <Sparkle className="absolute bottom-[10%] left-[18%] h-3 w-3 text-[var(--border)] animate-float-reverse [animation-delay:1.2s]" />
        <Sparkle className="absolute bottom-[8%] left-[30%] h-5 w-5 text-[var(--border)] animate-float [animation-delay:0.4s]" />
        <Sparkle className="absolute bottom-[12%] right-[28%] h-4 w-4 text-[var(--border)] animate-float-reverse [animation-delay:0.9s]" />
        <Sparkle className="absolute bottom-[6%] right-[15%] h-3 w-3 text-[var(--border)] animate-float [animation-delay:1.5s]" />
        <Sparkle className="absolute bottom-[18%] right-[5%] h-5 w-5 text-[var(--border)] animate-float-reverse [animation-delay:0.2s]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-[var(--border)] bg-[var(--background)] shadow-sm">
              <Logo size={56} className="text-[var(--foreground)]" />
            </div>
          </div>

          {/* Main Headline */}
          <h1
            data-testid="hero-headline"
            className="mx-auto max-w-4xl text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl"
          >
            Any article. Any voice.
            <br />
            <span className="text-[var(--foreground)]">10 seconds.</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
            Paste any URL, pick a voice, and start listening. Transform your
            reading list into your personal podcast library.
          </p>
        </div>

        {/* Sample Player */}
        <div className="mx-auto mt-16 max-w-3xl">
          <HeroPlayer />
        </div>

      </div>
    </section>
  );
}
