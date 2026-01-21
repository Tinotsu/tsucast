/**
 * Speed Control Component
 *
 * Dropdown for selecting playback speed.
 * Story: 3-5 Playback Speed Control
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { cn } from '@/utils/cn';
import { SPEED_OPTIONS } from '@/hooks/usePlaybackSpeed';

interface SpeedControlProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

export function SpeedControl({
  currentSpeed,
  onSpeedChange,
  disabled = false,
}: SpeedControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, fadeAnim]);

  const handleSelect = (speed: number) => {
    onSpeedChange(speed);
    setIsOpen(false);
  };

  const formatSpeed = (speed: number) => {
    return speed === 1 ? '1x' : `${speed}x`;
  };

  return (
    <View>
      {/* Speed Button */}
      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
        className={cn(
          'px-3 py-2 rounded-lg min-w-[48px] items-center',
          'bg-amber-200/50 dark:bg-amber-800/50',
          disabled && 'opacity-50'
        )}
        accessibilityLabel={`Playback speed ${formatSpeed(currentSpeed)}`}
        accessibilityRole="button"
        accessibilityHint="Double tap to change playback speed"
      >
        <Text className="text-amber-900 dark:text-amber-100 font-semibold text-sm">
          {formatSpeed(currentSpeed)}
        </Text>
      </TouchableOpacity>

      {/* Speed Options Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setIsOpen(false)}
        >
          <Animated.View
            style={{ opacity: fadeAnim }}
            className="bg-cream dark:bg-deep-brown rounded-t-3xl pb-8"
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-amber-300 dark:bg-amber-700 rounded-full" />
            </View>

            {/* Title */}
            <Text className="text-lg font-bold text-amber-900 dark:text-amber-100 text-center mb-4">
              Playback Speed
            </Text>

            {/* Speed Options */}
            <View className="px-6">
              <View className="bg-amber-100/50 dark:bg-amber-900/30 rounded-2xl overflow-hidden">
                {SPEED_OPTIONS.map((speed, index) => (
                  <TouchableOpacity
                    key={speed}
                    onPress={() => handleSelect(speed)}
                    activeOpacity={0.7}
                    className={cn(
                      'flex-row items-center justify-between px-5 py-4',
                      index !== SPEED_OPTIONS.length - 1 &&
                        'border-b border-amber-200/50 dark:border-amber-700/50'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-base',
                        currentSpeed === speed
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-amber-900 dark:text-amber-100'
                      )}
                    >
                      {formatSpeed(speed)}
                      {speed === 1 && ' (Normal)'}
                    </Text>
                    {currentSpeed === speed && (
                      <View className="w-5 h-5 bg-amber-500 rounded-full items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
