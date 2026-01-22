/**
 * Cookie utility functions
 *
 * Centralized cookie management to avoid duplication and ensure
 * consistent handling across the application.
 */

/**
 * Clear all Supabase authentication cookies.
 * Supabase auth cookies start with 'sb-' prefix.
 *
 * This is used to clean up stale auth state on logout or
 * when authentication errors are detected.
 */
export function clearAuthCookies(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    const eqIndex = trimmed.indexOf('=');
    const name = eqIndex > -1 ? trimmed.substring(0, eqIndex) : trimmed;

    if (name.startsWith('sb-')) {
      // Set cookie to expire in the past to delete it
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}
