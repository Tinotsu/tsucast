/**
 * LibraryItem Component
 *
 * Individual library item with swipe-to-delete and playback progress.
 * Stories: 4-1 Library View, 4-3 Playlist Management, 6-2 Performance Optimization
 */

import { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import type { LibraryItem as LibraryItemData } from '@/services/api';
import { formatDuration, formatRelativeDate } from '@/utils/format';

interface LibraryItemProps {
  item: LibraryItemData;
  onDelete: () => void;
  onLongPress?: () => void;
}

export const LibraryItem = memo(function LibraryItem({ item, onDelete, onLongPress }: LibraryItemProps) {
  const duration = item.audio?.duration_seconds || 0;
  const progress = duration > 0
    ? (item.playback_position / duration) * 100
    : 0;
  const title = item.audio?.title || 'Untitled';
  const durationText = formatDuration(item.audio?.duration_seconds);
  const dateText = formatRelativeDate(item.added_at);

  const handlePress = () => {
    if (item.audio?.id) {
      router.push(`/player/${item.audio.id}`);
    }
  };

  const renderRightActions = () => (
    <TouchableOpacity
      onPress={onDelete}
      className="bg-red-500 justify-center px-6"
      activeOpacity={0.7}
      accessibilityLabel={`Delete ${title}`}
      accessibilityRole="button"
    >
      <Ionicons name="trash" size={24} color="white" />
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={onLongPress}
        delayLongPress={400}
        className="flex-row p-4 bg-cream dark:bg-deep-brown border-b border-amber-200 dark:border-amber-800"
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${durationText}, ${dateText}${item.is_played ? ', completed' : ''}`}
        accessibilityHint={onLongPress ? 'Tap to play, long press for options' : 'Tap to play'}
      >
        {/* Progress indicator - use absolute positioning for consistent height */}
        <View className="w-1 self-stretch rounded-full bg-amber-200 dark:bg-amber-800 mr-3">
          <View
            className="w-full bg-amber-500 rounded-full absolute bottom-0"
            style={{ height: `${Math.min(progress, 100)}%` }}
          />
        </View>

        <View className="flex-1">
          <Text
            className="text-base font-medium text-amber-900 dark:text-amber-100"
            numberOfLines={2}
          >
            {title}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-sm text-amber-600 dark:text-amber-400">
              {durationText}
            </Text>
            <Text className="text-sm text-amber-500 mx-2">•</Text>
            <Text className="text-sm text-amber-600 dark:text-amber-400">
              {dateText}
            </Text>
            {item.is_played && (
              <>
                <Text className="text-sm text-amber-500 mx-2">•</Text>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </>
            )}
          </View>
        </View>

        <View className="justify-center">
          <Ionicons name="chevron-forward" size={20} color="#92400E" />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.playback_position === nextProps.item.playback_position &&
    prevProps.item.is_played === nextProps.item.is_played &&
    prevProps.item.audio?.title === nextProps.item.audio?.title
  );
});
