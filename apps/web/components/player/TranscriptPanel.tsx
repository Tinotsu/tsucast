"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Transcript JSON schema (v1)
interface TranscriptWord {
  text: string;
  start_ts: number;
  end_ts: number;
}

interface TranscriptChapter {
  title: string;
  start_ts: number;
  word_index: number;
}

interface TranscriptJson {
  version: number;
  title: string;
  words: TranscriptWord[];
  chapters: TranscriptChapter[];
}

interface TranscriptPanelProps {
  transcriptUrl: string;
  currentTime: number;
  onSeek: (time: number) => void;
}

// Binary search to find word index by timestamp
function findWordIndexByTime(
  words: TranscriptWord[],
  position: number
): number {
  if (words.length === 0) return -1;

  // Handle edge cases
  if (position < words[0].start_ts) return 0;
  if (position >= words[words.length - 1].end_ts) return words.length - 1;

  // Binary search for word where start_ts <= position < end_ts
  let left = 0;
  let right = words.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const word = words[mid];

    if (position >= word.start_ts && position < word.end_ts) {
      return mid;
    } else if (position < word.start_ts) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  // If we land in a gap between words, use the next word
  return Math.min(left, words.length - 1);
}

export function TranscriptPanel({
  transcriptUrl,
  currentTime,
  onSeek,
}: TranscriptPanelProps) {
  const [transcript, setTranscript] = useState<TranscriptJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);
  const lastScrolledIndex = useRef<number>(-1);

  // Fetch transcript on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchTranscript() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(transcriptUrl);
        if (!response.ok) {
          throw new Error(`Failed to load transcript: ${response.status}`);
        }

        const data = (await response.json()) as TranscriptJson;

        if (!cancelled) {
          setTranscript(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load transcript"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTranscript();

    return () => {
      cancelled = true;
    };
  }, [transcriptUrl]);

  // Find current word index based on playback position
  const currentWordIndex = useMemo(() => {
    if (!transcript || transcript.words.length === 0) return -1;
    return findWordIndexByTime(transcript.words, currentTime);
  }, [transcript, currentTime]);

  // Auto-scroll to keep current word visible
  useEffect(() => {
    if (
      currentWordIndex < 0 ||
      !currentWordRef.current ||
      currentWordIndex === lastScrolledIndex.current
    ) {
      return;
    }

    lastScrolledIndex.current = currentWordIndex;

    currentWordRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [currentWordIndex]);

  const handleWordClick = useCallback(
    (startTs: number) => {
      onSeek(startTs);
    },
    [onSeek]
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center py-8 px-4">
        <p className="text-[var(--muted)] text-center">{error}</p>
      </div>
    );
  }

  if (!transcript || transcript.words.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-8 px-4">
        <p className="text-[var(--muted)] text-center">
          Transcript not available
        </p>
      </div>
    );
  }

  // Build chapter index map for quick lookup
  const chaptersByWordIndex = new Map<number, TranscriptChapter>();
  for (const chapter of transcript.chapters) {
    chaptersByWordIndex.set(chapter.word_index, chapter);
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 text-base leading-relaxed"
    >
      {transcript.words.map((word, index) => {
        const isCurrentWord = index === currentWordIndex;
        const chapter = chaptersByWordIndex.get(index);

        return (
          <span key={index}>
            {/* Chapter header before word if this is a chapter start */}
            {chapter && (
              <span className="block py-4 mt-4 border-t border-[var(--secondary)] text-lg font-bold text-[var(--foreground)]">
                {chapter.title}
              </span>
            )}
            <span
              ref={isCurrentWord ? currentWordRef : undefined}
              onClick={() => handleWordClick(word.start_ts)}
              className={cn(
                "cursor-pointer rounded px-0.5 transition-colors hover:bg-[var(--secondary)]",
                isCurrentWord &&
                  "bg-amber-400 dark:bg-amber-600 font-bold text-black dark:text-white"
              )}
            >
              {word.text}{" "}
            </span>
          </span>
        );
      })}
    </div>
  );
}
