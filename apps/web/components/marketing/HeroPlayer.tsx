"use client";

import { useEffect, useState } from "react";
import { EmbeddablePlayer } from "./EmbeddablePlayer";
import { getFreeContent, type FreeContentItem } from "@/lib/api";

export function HeroPlayer() {
  const [sample, setSample] = useState<FreeContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSample() {
      try {
        const items = await getFreeContent();
        if (cancelled) return;
        // Get the first ready item with audio
        const featured = items.find((item) => item.audio_url);
        if (featured) {
          setSample(featured);
        }
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadSample();

    return () => {
      cancelled = true;
    };
  }, []);

  // Don't show anything while loading or if there's no sample
  if (isLoading || hasError || !sample?.audio_url) {
    return null;
  }

  return (
    <div className="mt-8">
      <p className="text-center text-sm text-[#737373] mb-3">
        Try it — no signup required
      </p>
      <EmbeddablePlayer
        audioUrl={sample.audio_url}
        title={sample.title}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export default HeroPlayer;
