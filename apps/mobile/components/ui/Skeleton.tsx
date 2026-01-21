/**
 * Skeleton Component
 *
 * Animated loading placeholder for content.
 * Story: 6-2 Performance Optimization
 *
 * Uses React Native Animated to avoid additional dependencies.
 */

import { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, DimensionValue, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  radius = 8,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={[{ width, height }, style]}>
      <Animated.View
        style={[
          styles.skeleton,
          {
            width: '100%',
            height: '100%',
            borderRadius: radius,
            opacity,
          },
        ]}
      />
    </View>
  );
}

/**
 * SkeletonText - For text placeholders
 */
export function SkeletonText({
  width = '100%',
  lines = 1,
  lineHeight = 16,
  spacing = 8,
}: {
  width?: DimensionValue;
  lines?: number;
  lineHeight?: number;
  spacing?: number;
}) {
  return (
    <View style={{ gap: spacing }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 && lines > 1 ? '60%' : width}
          height={lineHeight}
          radius={4}
        />
      ))}
    </View>
  );
}

/**
 * SkeletonCircle - For avatar/icon placeholders
 */
export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} radius={size / 2} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E5E5',
  },
});
