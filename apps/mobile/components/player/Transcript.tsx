/**
 * Transcript Component
 *
 * Displays word-synced transcript with highlighting and tap-to-seek.
 * Story: Transcript & Chapters Support
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { cn } from '@/utils/cn';

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

// Paragraph item for FlatList rendering
interface ParagraphItem {
  id: string;
  type: 'chapter' | 'paragraph';
  title?: string;
  words?: TranscriptWord[];
  wordStartIndex?: number;
}

interface TranscriptProps {
  transcriptUrl: string;
  currentPosition: number;
  onSeek: (time: number) => void;
}

// Split words into paragraphs for efficient rendering
// Each paragraph is ~50 words to balance rendering performance and scroll granularity
const WORDS_PER_PARAGRAPH = 50;

function buildParagraphs(
  words: TranscriptWord[],
  chapters: TranscriptChapter[]
): ParagraphItem[] {
  const items: ParagraphItem[] = [];
  let wordIndex = 0;

  // Sort chapters by word_index
  const sortedChapters = [...chapters].sort(
    (a, b) => a.word_index - b.word_index
  );
  let chapterIndex = 0;

  while (wordIndex < words.length) {
    // Check if we need to insert a chapter header
    if (
      chapterIndex < sortedChapters.length &&
      sortedChapters[chapterIndex].word_index <= wordIndex
    ) {
      items.push({
        id: `chapter-${chapterIndex}`,
        type: 'chapter',
        title: sortedChapters[chapterIndex].title,
      });
      chapterIndex++;
      continue;
    }

    // Calculate end of this paragraph
    const nextChapterWordIndex =
      chapterIndex < sortedChapters.length
        ? sortedChapters[chapterIndex].word_index
        : words.length;

    const paragraphEnd = Math.min(
      wordIndex + WORDS_PER_PARAGRAPH,
      nextChapterWordIndex,
      words.length
    );

    items.push({
      id: `para-${wordIndex}`,
      type: 'paragraph',
      words: words.slice(wordIndex, paragraphEnd),
      wordStartIndex: wordIndex,
    });

    wordIndex = paragraphEnd;
  }

  return items;
}

// Binary search to find word index by timestamp
function findWordIndexByTime(words: TranscriptWord[], position: number): number {
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

export function Transcript({
  transcriptUrl,
  currentPosition,
  onSeek,
}: TranscriptProps) {
  const [transcript, setTranscript] = useState<TranscriptJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const lastScrolledWordIndex = useRef<number>(-1);

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
            err instanceof Error ? err.message : 'Failed to load transcript'
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

  // Build paragraph items for FlatList
  const paragraphItems = useMemo(() => {
    if (!transcript) return [];
    return buildParagraphs(transcript.words, transcript.chapters);
  }, [transcript]);

  // Find current word index based on playback position
  const currentWordIndex = useMemo(() => {
    if (!transcript || transcript.words.length === 0) return -1;
    return findWordIndexByTime(transcript.words, currentPosition);
  }, [transcript, currentPosition]);

  // Auto-scroll to keep current word visible (in upper 30% of container)
  useEffect(() => {
    if (
      currentWordIndex < 0 ||
      !flatListRef.current ||
      paragraphItems.length === 0
    ) {
      return;
    }

    // Find which paragraph contains the current word
    let targetParagraphIndex = -1;
    for (let i = 0; i < paragraphItems.length; i++) {
      const item = paragraphItems[i];
      if (item.type === 'paragraph' && item.wordStartIndex !== undefined) {
        const wordEnd =
          item.wordStartIndex + (item.words?.length ?? 0);
        if (
          currentWordIndex >= item.wordStartIndex &&
          currentWordIndex < wordEnd
        ) {
          targetParagraphIndex = i;
          break;
        }
      }
    }

    // Only scroll if we moved to a different paragraph
    if (
      targetParagraphIndex >= 0 &&
      targetParagraphIndex !== lastScrolledWordIndex.current
    ) {
      lastScrolledWordIndex.current = targetParagraphIndex;

      flatListRef.current.scrollToIndex({
        index: targetParagraphIndex,
        animated: true,
        viewPosition: 0.3, // Position at upper 30% of view
      });
    }
  }, [currentWordIndex, paragraphItems]);

  // Render a word with optional highlighting
  const renderWord = useCallback(
    (word: TranscriptWord, index: number, globalIndex: number) => {
      const isCurrentWord = globalIndex === currentWordIndex;

      return (
        <TouchableOpacity
          key={index}
          onPress={() => onSeek(word.start_ts)}
          activeOpacity={0.7}
        >
          <Text
            className={cn(
              'text-base leading-7',
              isCurrentWord
                ? 'bg-amber-400 dark:bg-amber-600 font-bold rounded px-0.5'
                : 'text-zinc-100'
            )}
          >
            {word.text}{' '}
          </Text>
        </TouchableOpacity>
      );
    },
    [currentWordIndex, onSeek]
  );

  // Render a paragraph item
  const renderItem = useCallback(
    ({ item }: { item: ParagraphItem }) => {
      if (item.type === 'chapter') {
        return (
          <View className="py-4 border-t border-zinc-700 mt-4">
            <Text className="text-lg font-bold text-amber-400">
              {item.title}
            </Text>
          </View>
        );
      }

      // Paragraph of words
      return (
        <View className="flex-row flex-wrap py-1">
          {item.words?.map((word, idx) =>
            renderWord(word, idx, (item.wordStartIndex ?? 0) + idx)
          )}
        </View>
      );
    },
    [renderWord]
  );

  // Handle scroll errors (item out of range)
  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number }) => {
      // Scroll to the highest measured frame and retry
      flatListRef.current?.scrollToIndex({
        index: Math.min(info.index, info.highestMeasuredFrameIndex),
        animated: true,
      });
    },
    []
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-zinc-400 mt-4">Loading transcript...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-8 px-4">
        <Text className="text-zinc-400 text-center">{error}</Text>
      </View>
    );
  }

  if (!transcript || transcript.words.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8 px-4">
        <Text className="text-zinc-400 text-center">
          Transcript not available
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={paragraphItems}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      onScrollToIndexFailed={handleScrollToIndexFailed}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}
