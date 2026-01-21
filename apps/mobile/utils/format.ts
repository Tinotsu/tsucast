/**
 * Format Utilities
 *
 * Shared formatting functions used across the app.
 */

/**
 * Format duration in seconds to human-readable string
 * @param seconds - Duration in seconds (can be null/undefined)
 * @returns Formatted string like "5 min" or "1h 30m"
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '0 min';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Format date to relative time string
 * @param dateString - ISO date string
 * @returns Formatted string like "Today", "Yesterday", "3 days ago"
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

/**
 * Format time in seconds to mm:ss or hh:mm:ss
 * @param seconds - Time in seconds
 * @returns Formatted string like "5:30" or "1:05:30"
 */
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
