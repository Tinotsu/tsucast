/**
 * AddScreenSkeleton Component
 *
 * Loading skeleton for the Add screen.
 * Story: 6-2 Performance Optimization
 */

import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export function AddScreenSkeleton() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* URL Input skeleton */}
        <Skeleton height={120} radius={16} style={styles.input} />

        {/* Limit banner skeleton */}
        <Skeleton height={52} radius={12} style={styles.banner} />

        {/* Voice selector header skeleton */}
        <SkeletonText width={100} lineHeight={20} />

        {/* Voice cards skeleton */}
        <View style={styles.voiceCards}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              width={120}
              height={100}
              radius={12}
              style={styles.voiceCard}
            />
          ))}
        </View>

        {/* Generate button skeleton */}
        <Skeleton height={56} radius={12} style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEB', // cream
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  banner: {
    marginBottom: 24,
  },
  voiceCards: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 24,
    gap: 12,
  },
  voiceCard: {
    // individual card styling
  },
  button: {
    marginTop: 'auto',
  },
});
