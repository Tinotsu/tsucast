-- Migration: Add featured column to free_content table
-- Allows admins to mark one item as featured for the landing page hero section

-- Add featured column
ALTER TABLE public.free_content
ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- Create partial unique index to ensure only one featured item
-- This constraint only applies where featured = true
CREATE UNIQUE INDEX IF NOT EXISTS idx_free_content_featured_unique
  ON public.free_content (featured)
  WHERE featured = true;

-- Index for quick lookup of featured item
CREATE INDEX IF NOT EXISTS idx_free_content_featured
  ON public.free_content (featured)
  WHERE featured = true AND status = 'ready';
