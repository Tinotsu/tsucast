/**
 * LibrarySkeleton Component
 *
 * Loading skeleton for library screen.
 * Story: 4-1 Library View
 */

import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function SkeletonItem() {
  return (
    <View className="flex-row p-4 border-b border-amber-200 dark:border-amber-800">
      {/* Progress indicator skeleton */}
      <View className="w-1 h-16 rounded-full bg-amber-200 dark:bg-amber-800 mr-3" />

      <View className="flex-1">
        {/* Title skeleton */}
        <View className="h-5 bg-amber-200 dark:bg-amber-800 rounded w-3/4 mb-2" />
        {/* Subtitle skeleton */}
        <View className="h-4 bg-amber-200 dark:bg-amber-800 rounded w-1/2" />
      </View>
    </View>
  );
}

export function LibrarySkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown" edges={['top']}>
      <View className="flex-1">
        <SkeletonItem />
        <SkeletonItem />
        <SkeletonItem />
        <SkeletonItem />
        <SkeletonItem />
      </View>
    </SafeAreaView>
  );
}
