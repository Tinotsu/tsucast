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
          credits_balance: number;
          time_bank_minutes: number;
          credits_purchased: number;
          credits_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          subscription_tier?: 'free' | 'pro';
          daily_generations?: number;
          daily_generations_reset_at?: string;
          credits_balance?: number;
          time_bank_minutes?: number;
          credits_purchased?: number;
          credits_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          subscription_tier?: 'free' | 'pro';
          daily_generations?: number;
          daily_generations_reset_at?: string;
          credits_balance?: number;
          time_bank_minutes?: number;
          credits_purchased?: number;
          credits_used?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      audio_cache: {
        Row: {
          id: string;
          url_hash: string;
          voice_id: string;
          original_url: string | null;
          normalized_url: string | null;
          status: 'pending' | 'processing' | 'ready' | 'failed';
          audio_url: string | null;
          title: string | null;
          word_count: number | null;
          duration_seconds: number | null;
          file_size_bytes: number | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          url_hash: string;
          voice_id: string;
          original_url?: string | null;
          normalized_url?: string | null;
          status?: 'pending' | 'processing' | 'ready' | 'failed';
          audio_url?: string | null;
          title?: string | null;
          word_count?: number | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          url_hash?: string;
          voice_id?: string;
          original_url?: string | null;
          normalized_url?: string | null;
          status?: 'pending' | 'processing' | 'ready' | 'failed';
          audio_url?: string | null;
          title?: string | null;
          word_count?: number | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
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
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'purchase' | 'generation' | 'refund' | 'adjustment';
          credits: number;
          time_bank_delta: number;
          description: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'purchase' | 'generation' | 'refund' | 'adjustment';
          credits: number;
          time_bank_delta?: number;
          description?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'purchase' | 'generation' | 'refund' | 'adjustment';
          credits?: number;
          time_bank_delta?: number;
          description?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      user_library: {
        Row: {
          id: string;
          user_id: string;
          audio_id: string;
          playback_position: number;
          is_played: boolean;
          added_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          audio_id: string;
          playback_position?: number;
          is_played?: boolean;
          added_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          audio_id?: string;
          playback_position?: number;
          is_played?: boolean;
          added_at?: string;
          updated_at?: string;
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
export type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row'];
