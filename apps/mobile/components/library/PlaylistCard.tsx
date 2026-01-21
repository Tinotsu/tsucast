/**
 * PlaylistCard Component
 *
 * Card for displaying a playlist in the library.
 * Story: 4-3 Playlist Management
 */

import { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Playlist {
  id: string;
  name: string;
  itemCount: number;
}

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: () => void;
  onLongPress: () => void;
}

export const PlaylistCard = memo(function PlaylistCard({
  playlist,
  onPress,
  onLongPress,
}: PlaylistCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      className="p-4 bg-amber-100 dark:bg-amber-900/50 rounded-xl mr-3 w-40"
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${playlist.name}, ${playlist.itemCount} ${playlist.itemCount === 1 ? 'item' : 'items'}`}
      accessibilityHint="Tap to open, long press for options"
    >
      <View className="w-full h-24 bg-amber-200 dark:bg-amber-800 rounded-lg items-center justify-center mb-2">
        <Ionicons name="list" size={32} color="#F59E0B" />
      </View>
      <Text
        className="font-medium text-amber-900 dark:text-amber-100"
        numberOfLines={1}
      >
        {playlist.name}
      </Text>
      <Text className="text-sm text-amber-600 dark:text-amber-400">
        {playlist.itemCount} {playlist.itemCount === 1 ? 'item' : 'items'}
      </Text>
    </TouchableOpacity>
  );
});
