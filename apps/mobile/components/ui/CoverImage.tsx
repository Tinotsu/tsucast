/**
 * CoverImage Component
 *
 * Displays podcast cover art - supports image URLs, emoji, and default fallback.
 * Uses FadeImage for lazy loading with blurhash placeholder.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FadeImage } from './FadeImage';

interface CoverImageProps {
  cover: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Check if cover value is an image URL
 */
function isImageUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

export function CoverImage({ cover, size, style }: CoverImageProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when cover changes
  useEffect(() => {
    setHasError(false);
  }, [cover]);

  const baseStyle = { width: size, height: size, borderRadius: 8 };

  // Default icon fallback
  if (!cover || hasError) {
    return (
      <View
        style={[baseStyle, style]}
        className="items-center justify-center bg-amber-100 dark:bg-amber-900/30"
      >
        <Ionicons name="headset" size={size * 0.5} color="#F59E0B" />
      </View>
    );
  }

  // Image URL
  if (isImageUrl(cover)) {
    return (
      <FadeImage
        source={cover}
        style={baseStyle}
        onError={() => setHasError(true)}
      />
    );
  }

  // Emoji - centered
  return (
    <View
      style={[baseStyle, style]}
      className="items-center justify-center bg-amber-100 dark:bg-amber-900/30"
    >
      <Text style={{ fontSize: size * 0.6 }}>{cover}</Text>
    </View>
  );
}
