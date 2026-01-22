"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearAuthCookies } from "@/lib/cookies";
import type { User, Session, SupabaseClient } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  subscription_tier: "free" | "pro";
  daily_generations: number;
  is_admin: boolean;
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const initializedRef = useRef(false);

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
    const supabase = getSupabase();

    // Initialize auth state deterministically by checking session first
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        }

        initializedRef.current = true;
        setIsLoading(false);
      } catch (err) {
        console.error("[useAuth] Failed to initialize auth:", err);
        if (mounted) {
          initializedRef.current = true;
          setIsLoading(false);
        }
      }
    };

    // Listen for auth changes after initial load
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      // Skip INITIAL_SESSION event - we handle it explicitly above
      if (event === "INITIAL_SESSION") return;

      // Set session and user
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Fetch profile if user is logged in
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [getSupabase, fetchProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }, [getSupabase]);

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
    isPro: profile?.subscription_tier === "pro",
    isAdmin: profile?.is_admin ?? false,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    refetchProfile: () => user && fetchProfile(user.id),
  };
}
