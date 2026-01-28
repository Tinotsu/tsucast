/**
 * HLS Manifest Service
 *
 * Generates and updates HLS playlists for streaming audio.
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */

export interface HlsSegment {
  index: number;
  url: string;
  duration: number; // seconds
}

export interface HlsManifestOptions {
  streamId: string;
  segments: HlsSegment[];
  isComplete: boolean;
  targetDuration?: number; // max segment duration, default calculated from segments
}

/**
 * Generate HLS playlist content (m3u8)
 *
 * Creates an EVENT playlist during generation (segments never removed),
 * converted to VOD playlist when complete.
 */
export function generateManifest(options: HlsManifestOptions): string {
  const { segments, isComplete, targetDuration } = options;

  // Calculate target duration (must be >= max segment duration, rounded up)
  const maxSegmentDuration =
    segments.length > 0
      ? Math.max(...segments.map((s) => s.duration))
      : 30;
  const effectiveTargetDuration = Math.ceil(
    targetDuration ?? Math.max(maxSegmentDuration, 30)
  );

  const lines: string[] = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    `#EXT-X-TARGETDURATION:${effectiveTargetDuration}`,
    '#EXT-X-MEDIA-SEQUENCE:0',
  ];

  // EVENT playlist during generation, VOD when complete
  if (!isComplete) {
    lines.push('#EXT-X-PLAYLIST-TYPE:EVENT');
  } else {
    lines.push('#EXT-X-PLAYLIST-TYPE:VOD');
  }

  lines.push(''); // Blank line before segments

  // Add segments in order
  const sortedSegments = [...segments].sort((a, b) => a.index - b.index);

  for (const segment of sortedSegments) {
    // EXTINF duration should be the actual segment duration
    lines.push(`#EXTINF:${segment.duration.toFixed(3)},`);
    lines.push(segment.url);
  }

  // Mark as complete if all segments ready
  if (isComplete) {
    lines.push('#EXT-X-ENDLIST');
  }

  return lines.join('\n');
}

/**
 * Generate manifest storage key
 */
export function getManifestKey(streamId: string): string {
  return `streams/${streamId}/playlist.m3u8`;
}

/**
 * Generate segment storage key
 */
export function getSegmentKey(streamId: string, chunkIndex: number): string {
  const paddedIndex = chunkIndex.toString().padStart(3, '0');
  return `streams/${streamId}/segment-${paddedIndex}.mp3`;
}

/**
 * Calculate the polling interval for HLS clients
 * Per spec: should poll at targetDuration / 2
 */
export function getRecommendedPollInterval(targetDuration: number): number {
  return Math.max(2, Math.floor(targetDuration / 2));
}
