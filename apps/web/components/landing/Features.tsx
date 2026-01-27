import {
  Zap,
  Mic2,
  Library,
  Moon,
  Headphones,
  Clock,
  Smartphone,
  Gauge,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Audio starts playing in under 10 seconds. No waiting around for your content.",
  },
  {
    icon: Mic2,
    title: "Premium AI Voices",
    description:
      "Choose from natural-sounding voices that make listening a pleasure.",
  },
  {
    icon: Library,
    title: "Personal Library",
    description:
      "Build your podcast library. All your converted articles in one place.",
  },
  {
    icon: Moon,
    title: "Sleep Timer",
    description:
      "Set a timer to pause playback. Perfect for listening before bed.",
  },
  {
    icon: Headphones,
    title: "Background Play",
    description:
      "Control playback from lock screen or Bluetooth. Listen while you walk.",
  },
  {
    icon: Clock,
    title: "Remember Position",
    description:
      "Pick up exactly where you left off. Your progress syncs across devices.",
  },
  {
    icon: Smartphone,
    title: "Works Anywhere",
    description:
      "Paste any article URL - news, blogs, research papers, documentation.",
  },
  {
    icon: Gauge,
    title: "Speed Control",
    description:
      "0.5x to 2x playback speed. Consume content at your own pace.",
  },
];

export function Features() {
  return (
    <section className="bg-white py-32" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl">
            Everything You Need to Listen
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#737373]">
            tsucast is designed for one thing: turning your reading list into
            audio you can enjoy anywhere.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-white p-8 transition-all hover:bg-[#fafafa]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f5f5] text-[#1a1a1a] transition-colors group-hover:bg-black group-hover:text-white">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-[#1a1a1a]">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#737373]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
