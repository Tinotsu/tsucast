"use client";

import { useEffect, useRef, useState } from "react";
import {
  Zap,
  Mic2,
  Library,
  Moon,
  Globe,
  Gauge,
} from "lucide-react";
import { VoiceTester } from "./VoiceTester";

const CONTENT_TYPES = ["Articles", "Blogs", "PDFs", "Newsletters"];
const TIMER_OPTIONS = ["5 min", "15 min", "30 min", "End of article"];

/**
 * LightningFast - Animated counter feature card
 */
function LightningFastCard() {
  const [count, setCount] = useState(0);
  const [showReady, setShowReady] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection observer for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isVisible) {
      setCount(0);
      setShowReady(false);
      return;
    }

    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    const runAnimation = () => {
      setCount(0);
      setShowReady(false);

      let currentCount = 0;
      interval = setInterval(() => {
        currentCount++;
        setCount(currentCount);

        if (currentCount >= 8) {
          clearInterval(interval);
          setShowReady(true);

          timeout = setTimeout(() => {
            runAnimation();
          }, 2000);
        }
      }, 100);
    };

    runAnimation();

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isVisible]);

  return (
    <div
      ref={cardRef}
      className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--foreground)]"
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--border)] text-[var(--foreground)] transition-colors group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)]">
        <Zap className="h-6 w-6" />
      </div>
      <h3 className="mb-3 text-lg font-bold text-[var(--foreground)]">
        Lightning Fast
      </h3>
      <div className="mb-2 font-mono text-3xl font-bold text-[var(--foreground)]">
        {showReady ? (
          <span className="text-green-500">Ready!</span>
        ) : (
          <span>{count}s</span>
        )}
      </div>
      <p className="text-sm text-[var(--muted)]">
        URL &rarr; Audio in under 10 seconds
      </p>
    </div>
  );
}

/**
 * WorksAnywhere - Rotating content types
 */
function WorksAnywhereCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % CONTENT_TYPES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <div
      ref={cardRef}
      className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--foreground)]"
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--border)] text-[var(--foreground)] transition-colors group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)]">
        <Globe className="h-6 w-6" />
      </div>
      <h3 className="mb-3 text-lg font-bold text-[var(--foreground)]">
        Works Anywhere
      </h3>
      <div className="mb-2 h-8 overflow-hidden">
        {CONTENT_TYPES.map((type, i) => (
          <div
            key={type}
            className={`text-lg font-medium transition-all duration-300 ${
              i === currentIndex
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0 absolute"
            }`}
          >
            {type}
          </div>
        ))}
      </div>
      <p className="text-sm text-[var(--muted)]">
        News, blogs, research, documentation
      </p>
    </div>
  );
}

/**
 * SleepTimer - Moon animation card
 */
function SleepTimerCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % TIMER_OPTIONS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <div
      ref={cardRef}
      className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--foreground)]"
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--border)] text-[var(--foreground)] transition-colors group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)]">
        <Moon className="h-6 w-6 animate-pulse" />
      </div>
      <h3 className="mb-3 text-lg font-bold text-[var(--foreground)]">
        Sleep Timer
      </h3>
      <div className="mb-2 h-6 overflow-hidden">
        {TIMER_OPTIONS.map((option, i) => (
          <div
            key={option}
            className={`text-sm font-medium text-[var(--muted)] transition-all duration-300 ${
              i === currentIndex
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0 absolute"
            }`}
          >
            {option}
          </div>
        ))}
      </div>
      <p className="text-sm text-[var(--muted)]">Fall asleep listening</p>
    </div>
  );
}

/**
 * Static feature card
 */
function StaticFeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Library;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--foreground)]">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--border)] text-[var(--foreground)] transition-colors group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-3 text-lg font-bold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}

export function Features() {
  return (
    <section
      data-testid="features-grid"
      className="bg-[var(--background)] py-16"
      id="features"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Everything You Need
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--muted)]">
            Turn your reading list into audio you can enjoy anywhere.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Row 1 */}
          <LightningFastCard />
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--border)] text-[var(--foreground)]">
              <Mic2 className="h-6 w-6" />
            </div>
            <h3 className="mb-4 text-lg font-bold text-[var(--foreground)]">
              Premium AI Voices
            </h3>
            <VoiceTester />
          </div>
          <WorksAnywhereCard />

          {/* Row 2 */}
          <SleepTimerCard />
          <StaticFeatureCard
            icon={Library}
            title="Personal Library"
            description="Save articles, resume anywhere. Your progress syncs across devices."
          />
          <StaticFeatureCard
            icon={Gauge}
            title="Speed Control"
            description="0.5x to 2x playback speed. Consume content at your pace."
          />
        </div>
      </div>
    </section>
  );
}
