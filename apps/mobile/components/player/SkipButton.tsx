/**
 * Skip Button Component
 *
 * Skip forward/backward buttons with labels.
 * Story: 3-3 Player Screen & Controls
 */

import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SkipButtonProps {
  direction: 'forward' | 'backward';
  onPress: () => void;
  disabled?: boolean;
}

export function SkipButton({
  direction,
  onPress,
  disabled = false,
}: SkipButtonProps) {
  const isForward = direction === 'forward';
  const icon = isForward ? 'play-forward' : 'play-back';
  const label = isForward ? '30' : '15';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      className="items-center p-2"
      accessibilityLabel={`Skip ${direction} ${label} seconds`}
      accessibilityRole="button"
    >
      <View className="relative">
        <Ionicons
          name={icon}
          size={36}
          color={disabled ? '#D4A574' : '#92400E'}
          className="dark:text-amber-300"
        />
        <View
          className="absolute -bottom-1 rounded-full px-1 bg-cream dark:bg-deep-brown"
          style={{ right: isForward ? -4 : undefined, left: isForward ? undefined : -4 }}
        >
          <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
            {label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
