-- Migration: Add transcript_url column to audio_cache
-- Story: Transcript & Chapters Support
-- Date: 2026-01-30

-- Add transcript_url column to store R2 URL for transcript JSON
ALTER TABLE public.audio_cache ADD COLUMN IF NOT EXISTS transcript_url TEXT;

-- No index needed: column is only read, never filtered/joined on
