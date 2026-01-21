/**
 * MiniPlayer Component
 *
 * Persistent mini-player bar that appears when audio is playing.
 * Story: 6-4 Persistent Mini-Player
 */

import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '@/stores/playerStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const { isPlaying, togglePlayPause, position, duration } = useAudioPlayer();

  // Animation for slide up/down
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (currentTrack) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [currentTrack, slideAnim]);

  // Don't render if no track
  if (!currentTrack) {
    return null;
  }

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const handlePress = () => {
    if (currentTrack.id) {
      router.push(`/player/${currentTrack.id}`);
    }
  };

  const handlePlayPause = () => {
    togglePlayPause();
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        position: 'absolute',
        bottom: 49 + insets.bottom, // Above tab bar (49px is default tab bar height)
        left: 0,
        right: 0,
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="bg-amber-100 dark:bg-amber-900/90 border-t border-amber-200 dark:border-amber-800"
      >
        {/* Progress bar */}
        <View className="h-0.5 bg-amber-200 dark:bg-amber-800">
          <View
            className="h-full bg-amber-500"
            style={{ width: `${progress}%` }}
          />
        </View>

        <View className="flex-row items-center px-4 py-3">
          {/* Track info */}
          <View className="flex-1 mr-4">
            <Text
              className="text-base font-medium text-amber-900 dark:text-amber-100"
              numberOfLines={1}
            >
              {currentTrack.title || 'Now Playing'}
            </Text>
            <Text className="text-sm text-amber-600 dark:text-amber-400">
              {formatTime(position)} / {formatTime(duration)}
            </Text>
          </View>

          {/* Play/Pause button */}
          <TouchableOpacity
            onPress={handlePlayPause}
            className="w-10 h-10 bg-amber-500 rounded-full items-center justify-center"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color="white"
              style={isPlaying ? undefined : { marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
