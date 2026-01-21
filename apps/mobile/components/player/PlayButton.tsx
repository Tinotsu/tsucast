/**
 * Play Button Component
 *
 * Toggles play/pause state with visual feedback.
 * Story: 3-3 Player Screen & Controls
 */

import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/utils/cn';

interface PlayButtonProps {
  isPlaying: boolean;
  isLoading?: boolean;
  onPress: () => void;
  size?: 'small' | 'large';
  disabled?: boolean;
}

export function PlayButton({
  isPlaying,
  isLoading = false,
  onPress,
  size = 'large',
  disabled = false,
}: PlayButtonProps) {
  const isLarge = size === 'large';
  const iconSize = isLarge ? 40 : 24;
  const buttonSize = isLarge ? 80 : 48;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      className={cn(
        'rounded-full items-center justify-center',
        'bg-amber-500 dark:bg-amber-600',
        'active:bg-amber-600 dark:active:bg-amber-700',
        disabled && 'opacity-50'
      )}
      style={{ width: buttonSize, height: buttonSize }}
    >
      {isLoading ? (
        <ActivityIndicator size={isLarge ? 'large' : 'small'} color="white" />
      ) : (
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={iconSize}
          color="white"
          style={isPlaying ? {} : { marginLeft: isLarge ? 4 : 2 }}
        />
      )}
    </TouchableOpacity>
  );
}
