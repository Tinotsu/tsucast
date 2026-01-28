/**
 * Read the access token directly from the Supabase auth cookie.
 *
 * This bypasses the broken getSession() in @supabase/ssr which deadlocks
 * due to navigator.locks (supabase/supabase-js#1594).
 */
export function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((c) => c.trim().match(/^sb-.*-auth-token=/));
  if (!authCookie) return null;

  try {
    const value = authCookie.split("=").slice(1).join("=").trim();

    let decoded: string;
    if (value.startsWith("base64-")) {
      decoded = atob(value.slice(7));
    } else {
      decoded = decodeURIComponent(value);
    }

    const session = JSON.parse(decoded);
    if (session.access_token) {
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        return null;
      }
      return session.access_token;
    }
  } catch {
    // Cookie is malformed or unparseable
  }

  return null;
}
