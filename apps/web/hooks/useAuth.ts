"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearAuthCookies } from "@/lib/cookies";
import { onAuthEvent } from "@/lib/auth-events";
import type { User, Session, SupabaseClient } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  credits_balance: number;
  time_bank_minutes: number;
  is_admin: boolean;
  created_at: string;
}

/**
 * Read the Supabase session directly from the auth cookie.
 *
 * This bypasses the broken getSession()/onAuthStateChange initialization
 * in @supabase/ssr which deadlocks due to navigator.locks
 * (supabase/supabase-js#1594).
 */
function readSessionFromCookie(): {
  access_token: string;
  refresh_token: string;
  user: User;
} | null {
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
    if (session.access_token && session.refresh_token && session.user) {
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        return null; // Token expired, let middleware handle refresh
      }
      return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user as User,
      };
    }
  } catch {
    // Cookie is malformed or unparseable
  }

  return null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const initializedRef = useRef(false);
  const signingOutRef = useRef(false);
  const router = useRouter();

  // Get or create supabase client
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  // Fetch user profile - logs errors instead of silently failing
  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[useAuth] Failed to fetch profile:", error.message);
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error("[useAuth] Profile fetch error:", err);
    }
  }, [getSupabase]);

  useEffect(() => {
    let mounted = true;

    // Bypass Supabase client auth initialization entirely.
    // The @supabase/ssr client's getSession()/onAuthStateChange deadlocks
    // due to navigator.locks (supabase/supabase-js#1594). Instead, read
    // the session directly from the cookie set by the middleware.
    const initializeAuth = async () => {
      try {
        const cookieData = readSessionFromCookie();

        if (!mounted) return;

        if (cookieData) {
          // Build a minimal Session object from the cookie data
          const sessionObj: Session = {
            access_token: cookieData.access_token,
            refresh_token: cookieData.refresh_token,
            token_type: "bearer",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user: cookieData.user,
          };
          setSession(sessionObj);
          setUser(cookieData.user);
          await fetchProfile(cookieData.user.id);
        }
      } catch (err) {
        console.error("[useAuth] Failed to initialize auth:", err);
      } finally {
        if (mounted) {
          initializedRef.current = true;
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [fetchProfile]);

  // Listen for unauthorized events from fetchApi and force sign-out + redirect
  useEffect(() => {
    return onAuthEvent("unauthorized", () => {
      // Debounce: multiple 401s can fire simultaneously
      if (signingOutRef.current) return;
      signingOutRef.current = true;

      // Clear local state immediately
      setUser(null);
      setSession(null);
      setProfile(null);
      clearAuthCookies();

      const supabase = getSupabase();
      supabase.auth.signOut().catch(() => {});

      router.push("/login");

      // Reset debounce after navigation settles
      setTimeout(() => {
        signingOutRef.current = false;
      }, 2000);
    });
  }, [getSupabase, router]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Update local state after successful sign-in
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      if (data.user) {
        await fetchProfile(data.user.id);
      }
    }

    return data;
  }, [getSupabase, fetchProfile]);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }, [getSupabase]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  }, [getSupabase]);

  const signInWithApple = useCallback(async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  }, [getSupabase]);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();

    // Clear local state immediately
    setUser(null);
    setSession(null);
    setProfile(null);

    // Clear Supabase auth cookies using shared utility
    clearAuthCookies();

    // signOut can also hang due to Supabase SSR bug - add timeout
    try {
      const timeoutPromise = new Promise<{ error: Error }>((resolve) => {
        setTimeout(() => resolve({ error: new Error("signOut timeout") }), 3000);
      });
      const signOutPromise = supabase.auth.signOut();
      await Promise.race([signOutPromise, timeoutPromise]);
    } catch {
      // Ignore errors - we've already cleared local state and cookies
    }
  }, [getSupabase]);

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: profile?.is_admin ?? false,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    refetchProfile: () => user && fetchProfile(user.id),
  };
}
