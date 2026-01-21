/**
 * FadeImage Component
 *
 * Optimized image component with fade-in transition.
 * Story: 6-2 Performance Optimization
 */

import { Image, ImageProps, ImageStyle } from 'expo-image';
import { StyleProp } from 'react-native';

interface FadeImageProps extends Omit<ImageProps, 'source' | 'style'> {
  source: string;
  style?: StyleProp<ImageStyle>;
}

// Default blurhash for loading placeholder (light amber color)
const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export function FadeImage({
  source,
  style,
  placeholder = { blurhash: DEFAULT_BLURHASH },
  transition = 200,
  contentFit = 'cover',
  ...props
}: FadeImageProps) {
  return (
    <Image
      source={{ uri: source }}
      style={style}
      placeholder={placeholder}
      transition={transition}
      contentFit={contentFit}
      {...props}
    />
  );
}
