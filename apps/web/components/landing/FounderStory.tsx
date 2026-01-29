import Image from "next/image";

/**
 * FounderStory - Personal story section to build trust
 */
export function FounderStory() {
  return (
    <section className="bg-[var(--background)] py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-[var(--border)] sm:h-32 sm:w-32">
              <Image
                src="/images/founder.jpg"
                alt="Tino, Founder of tsucast"
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          </div>

          {/* Story */}
          <div className="text-center sm:text-left">
            <h2 className="mb-4 text-xl font-bold text-[var(--foreground)] sm:text-2xl">
              Why I Built tsucast
            </h2>
            <blockquote className="mb-4 text-[var(--muted)] italic">
              &ldquo;I had hundreds of saved articles I never read. Podcasts
              worked for me, but articles didn&apos;t. So I built something to
              turn any article into a podcast I could listen to while walking,
              cooking, or falling asleep.&rdquo;
            </blockquote>
            <p className="font-bold text-[var(--foreground)]">
              &mdash; Tino, Founder
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
