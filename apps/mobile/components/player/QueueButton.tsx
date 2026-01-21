/**
 * QueueButton Component
 *
 * Button showing queue status with badge for item count.
 * Story: 4-4 Queue Management
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QueueButtonProps {
  queueLength: number;
  onPress: () => void;
}

export function QueueButton({ queueLength, onPress }: QueueButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="relative p-2"
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={queueLength > 0 ? `Queue, ${queueLength} ${queueLength === 1 ? 'item' : 'items'}` : 'Queue, empty'}
      accessibilityHint="Tap to view and manage playback queue"
    >
      <Ionicons name="list" size={24} color="#92400E" />
      {queueLength > 0 && (
        <View className="absolute -top-0.5 -right-0.5 bg-amber-500 rounded-full min-w-5 h-5 items-center justify-center px-1">
          <Text className="text-white text-xs font-bold">
            {queueLength > 9 ? '9+' : queueLength}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
