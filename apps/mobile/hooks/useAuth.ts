import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Map Supabase auth errors to user-friendly messages
export function getAuthErrorMessage(error: AuthError | null): string {
  if (!error) return '';

  const errorCode = error.message?.toLowerCase() || '';

  if (errorCode.includes('invalid login credentials') || errorCode.includes('invalid_credentials')) {
    return 'Invalid email or password';
  }
  if (errorCode.includes('email not confirmed')) {
    return 'Please verify your email before signing in';
  }
  if (errorCode.includes('user already registered') || errorCode.includes('already exists')) {
    return 'An account with this email already exists';
  }
  if (errorCode.includes('password') && errorCode.includes('least')) {
    return 'Password must be at least 8 characters';
  }
  if (errorCode.includes('invalid email')) {
    return 'Please enter a valid email address';
  }
  if (errorCode.includes('network') || errorCode.includes('fetch')) {
    return 'Unable to connect. Check your internet connection.';
  }

  // Default fallback
  return error.message || 'An error occurred. Please try again.';
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface UserProfile {
  id: string;
  email: string | null;
  subscription_tier: 'free' | 'pro';
  daily_generations: number;
  daily_generations_reset_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfile(session.user.id);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          // Auto-confirm for MVP (disable email verification)
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: 'Network error. Please try again.' } as AuthError,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: 'Network error. Please try again.' } as AuthError,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign in with Apple (iOS only)
  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      return {
        data: null,
        error: { message: 'Apple Sign-In is only available on iOS' } as AuthError,
      };
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return {
          data: null,
          error: { message: 'No identity token received from Apple' } as AuthError,
        };
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err: any) {
      // User cancelled - don't show error
      if (err.code === 'ERR_REQUEST_CANCELED') {
        return { data: null, error: null };
      }

      return {
        data: null,
        error: { message: 'Apple Sign-In failed. Please try again.' } as AuthError,
      };
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async (idToken: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: 'Google Sign-In failed. Please try again.' } as AuthError,
      };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      // Clear cached data but preserve user preferences
      try {
        const keys = await AsyncStorage.getAllKeys();
        // Filter out preference keys that should be preserved
        const keysToRemove = keys.filter(
          (key) => !key.startsWith('preference_') && !key.startsWith('settings_')
        );
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
        }
      } catch (err) {
        // Non-critical error, continue with logout
      }

      // Sign out from Supabase (this clears secure store tokens)
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error };
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);

      return { error: null };
    } catch (err) {
      return {
        error: { message: 'Error signing out. Please try again.' } as AuthError,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  return {
    user,
    session,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    isPro: profile?.subscription_tier === 'pro',
    signUp,
    signIn,
    signInWithApple,
    signInWithGoogle,
    signOut,
    refreshProfile,
    getAuthErrorMessage,
  };
}
