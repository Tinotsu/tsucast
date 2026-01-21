/**
 * Supabase Database Types
 *
 * Manual type definitions for database tables.
 * Generated from supabase/migrations/*.sql
 */

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          subscription_tier: 'free' | 'pro';
          daily_generations: number;
          daily_generations_reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          subscription_tier?: 'free' | 'pro';
          daily_generations?: number;
          daily_generations_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          subscription_tier?: 'free' | 'pro';
          daily_generations?: number;
          daily_generations_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      audio_cache: {
        Row: {
          id: string;
          url_hash: string;
          voice_id: string;
          status: 'pending' | 'processing' | 'ready' | 'failed';
          audio_url: string | null;
          title: string | null;
          word_count: number | null;
          duration_seconds: number | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          url_hash: string;
          voice_id: string;
          status?: 'pending' | 'processing' | 'ready' | 'failed';
          audio_url?: string | null;
          title?: string | null;
          word_count?: number | null;
          duration_seconds?: number | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          url_hash?: string;
          voice_id?: string;
          status?: 'pending' | 'processing' | 'ready' | 'failed';
          audio_url?: string | null;
          title?: string | null;
          word_count?: number | null;
          duration_seconds?: number | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      extraction_reports: {
        Row: {
          id: string;
          url: string;
          error_type: string;
          error_message: string | null;
          notes: string | null;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          error_type: string;
          error_message?: string | null;
          notes?: string | null;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          error_type?: string;
          error_message?: string | null;
          notes?: string | null;
          user_id?: string | null;
          created_at?: string;
        };
      };
      user_library: {
        Row: {
          id: string;
          user_id: string;
          cache_id: string;
          progress_seconds: number;
          completed: boolean;
          added_at: string;
          last_played_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          cache_id: string;
          progress_seconds?: number;
          completed?: boolean;
          added_at?: string;
          last_played_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          cache_id?: string;
          progress_seconds?: number;
          completed?: boolean;
          added_at?: string;
          last_played_at?: string | null;
        };
      };
    };
  };
}

// Helper types for easier usage
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type AudioCache = Database['public']['Tables']['audio_cache']['Row'];
export type ExtractionReport = Database['public']['Tables']['extraction_reports']['Row'];
export type UserLibraryItem = Database['public']['Tables']['user_library']['Row'];
