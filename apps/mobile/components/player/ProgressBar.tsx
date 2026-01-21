/**
 * Progress Bar Component
 *
 * Seekable progress bar with time display.
 * Story: 3-3 Player Screen & Controls
 */

import { useState } from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
  disabled?: boolean;
}

/**
 * Format seconds to mm:ss or hh:mm:ss
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ProgressBar({
  position,
  duration,
  onSeek,
  disabled = false,
}: ProgressBarProps) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  // Show seek position while dragging, otherwise show actual position
  const displayPosition = isSeeking ? seekPosition : position;

  // Calculate remaining time
  const remaining = Math.max(0, duration - displayPosition);

  return (
    <View className="px-6">
      {/* Slider */}
      <Slider
        value={displayPosition}
        minimumValue={0}
        maximumValue={duration || 1}
        disabled={disabled || duration === 0}
        onSlidingStart={(value) => {
          setIsSeeking(true);
          setSeekPosition(value);
        }}
        onValueChange={(value) => {
          if (isSeeking) {
            setSeekPosition(value);
          }
        }}
        onSlidingComplete={(value) => {
          setIsSeeking(false);
          onSeek(value);
        }}
        minimumTrackTintColor="#F59E0B"
        maximumTrackTintColor="#D4A574"
        thumbTintColor="#F59E0B"
        style={{ height: 40 }}
        accessibilityLabel="Playback progress"
        accessibilityHint="Drag to seek to a different position"
        accessibilityRole="adjustable"
      />

      {/* Time Display */}
      <View className="flex-row justify-between mt-1">
        <Text className="text-sm text-amber-700 dark:text-amber-300 font-medium">
          {formatTime(displayPosition)}
        </Text>
        <Text className="text-sm text-amber-700 dark:text-amber-300 font-medium">
          -{formatTime(remaining)}
        </Text>
      </View>
    </View>
  );
}
