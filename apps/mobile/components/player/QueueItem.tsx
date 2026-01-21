/**
 * QueueItem Component
 *
 * Individual item in the queue list with drag handle.
 * Story: 4-4 Queue Management
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { QueueTrack } from '@/hooks/useQueue';
import { formatDuration } from '@/utils/format';

interface QueueItemProps {
  item: QueueTrack;
  drag: () => void;
  isDragging: boolean;
  onRemove: () => void;
  onPlay: () => void;
}

export function QueueItem({ item, drag, isDragging, onRemove, onPlay }: QueueItemProps) {
  return (
    <View
      className={`flex-row items-center p-3 rounded-lg mb-2 ${
        isDragging
          ? 'bg-amber-200 dark:bg-amber-800'
          : 'bg-amber-50 dark:bg-amber-900/50'
      }`}
      accessibilityRole="button"
      accessibilityLabel={`${item.title || 'Untitled'}${item.duration ? `, ${formatDuration(item.duration)}` : ''}`}
      accessibilityHint="Tap to play, long press to drag and reorder"
    >
      {/* Drag handle */}
      <TouchableOpacity
        onPressIn={drag}
        className="pr-3"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Drag to reorder"
        accessibilityRole="button"
      >
        <Ionicons name="reorder-three" size={24} color="#92400E" />
      </TouchableOpacity>

      {/* Track info - tappable to play */}
      <TouchableOpacity
        onPress={onPlay}
        className="flex-1"
        activeOpacity={0.7}
        accessibilityLabel={`Play ${item.title || 'Untitled'}`}
        accessibilityRole="button"
      >
        <Text
          className="text-amber-900 dark:text-amber-100 font-medium"
          numberOfLines={1}
        >
          {item.title || 'Untitled'}
        </Text>
        {item.duration && (
          <Text className="text-xs text-amber-600 dark:text-amber-400">
            {formatDuration(item.duration)}
          </Text>
        )}
      </TouchableOpacity>

      {/* Remove button */}
      <TouchableOpacity
        onPress={onRemove}
        className="pl-3"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={`Remove ${item.title || 'Untitled'} from queue`}
        accessibilityRole="button"
      >
        <Ionicons name="close-circle" size={24} color="#DC2626" />
      </TouchableOpacity>
    </View>
  );
}
