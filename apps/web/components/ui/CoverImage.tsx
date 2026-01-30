/**
 * CoverImage Component
 *
 * Displays podcast cover art - supports image URLs, emoji, and default fallback.
 */

'use client';

import { useState, useEffect } from 'react';
import { Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoverImageProps {
  cover: string | null;
  size: number;
  className?: string;
}

/**
 * Check if cover value is an image URL
 */
function isImageUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

export function CoverImage({ cover, size, className }: CoverImageProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when cover changes
  useEffect(() => {
    setHasError(false);
  }, [cover]);

  // Default icon fallback
  if (!cover || hasError) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn(
          'flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-lg',
          className
        )}
      >
        <Headphones size={size * 0.5} className="text-amber-500" />
      </div>
    );
  }

  // Image URL - using raw <img> because these are user-provided external URLs
  // that cannot be optimized by next/image (requires allowlist in next.config.js)
  if (isImageUrl(cover)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external user URLs cannot use next/image
      <img
        src={cover}
        alt=""
        width={size}
        height={size}
        className={cn('object-cover rounded-lg', className)}
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  // Emoji - centered
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.6 }}
      className={cn(
        'flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-lg',
        className
      )}
    >
      {cover}
    </div>
  );
}
