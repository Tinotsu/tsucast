/**
 * Shared Constants
 *
 * Centralized constants for the web app.
 */

export const PRESET_EMOJIS = [
  "📚", "🎧", "🎙️", "📰", "💡", "🌍",
  "💼", "🏠", "❤️", "⭐", "🔥", "📝",
  "🎵", "🎬", "📖", "🧠", "💻", "🌟",
];

/**
 * Get a consistent random emoji based on an optional seed.
 * Without a seed, returns a truly random emoji.
 */
export function getRandomEmoji(seed?: string): string {
  if (!seed) {
    return PRESET_EMOJIS[Math.floor(Math.random() * PRESET_EMOJIS.length)];
  }
  // Simple hash function for consistent emoji per seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return PRESET_EMOJIS[Math.abs(hash) % PRESET_EMOJIS.length];
}
