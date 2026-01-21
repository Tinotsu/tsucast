/**
 * Sleep Timer Component
 *
 * Button and modal for setting sleep timer.
 * Story: 3-6 Sleep Timer
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
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/utils/cn';
import { TIMER_OPTIONS } from '@/hooks/useSleepTimer';

interface SleepTimerProps {
  remainingSeconds: number | null;
  endOfArticle: boolean;
  onSetTimer: (minutes: number) => void;
  onCancelTimer: () => void;
  disabled?: boolean;
}

/**
 * Format seconds to mm:ss
 */
function formatRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SleepTimer({
  remainingSeconds,
  endOfArticle,
  onSetTimer,
  onCancelTimer,
  disabled = false,
}: SleepTimerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isActive = (remainingSeconds !== null && remainingSeconds > 0) || endOfArticle;

  useEffect(() => {
    if (isOpen) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, fadeAnim]);

  const handleSelect = (minutes: number) => {
    if (minutes === 0) {
      onCancelTimer();
    } else {
      onSetTimer(minutes);
    }
    setIsOpen(false);
  };

  return (
    <View>
      {/* Timer Button */}
      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
        className={cn(
          'relative p-2',
          disabled && 'opacity-50'
        )}
        accessibilityLabel={
          isActive
            ? `Sleep timer active. ${
                endOfArticle
                  ? 'Will stop at end of article'
                  : `${Math.ceil(remainingSeconds! / 60)} minutes remaining`
              }`
            : 'Set sleep timer'
        }
        accessibilityRole="button"
      >
        <Ionicons
          name={isActive ? 'moon' : 'moon-outline'}
          size={24}
          color={isActive ? '#F59E0B' : '#92400E'}
        />
        {isActive && remainingSeconds !== null && (
          <View className="absolute -top-1 -right-1 bg-amber-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
            <Text className="text-[10px] text-white font-bold">
              {Math.ceil(remainingSeconds / 60)}
            </Text>
          </View>
        )}
        {endOfArticle && (
          <View className="absolute -top-1 -right-1 bg-amber-500 rounded-full w-2 h-2" />
        )}
      </TouchableOpacity>

      {/* Timer Options Modal */}
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
              Sleep Timer
            </Text>

            {/* Current Timer Status */}
            {isActive && (
              <View className="mx-6 mb-4 bg-amber-100/50 dark:bg-amber-900/30 rounded-xl px-4 py-3">
                <Text className="text-center text-amber-800 dark:text-amber-200">
                  {endOfArticle
                    ? 'Active: End of article'
                    : `Active: ${formatRemaining(remainingSeconds!)}`}
                </Text>
              </View>
            )}

            {/* Timer Options */}
            <View className="px-6">
              <View className="bg-amber-100/50 dark:bg-amber-900/30 rounded-2xl overflow-hidden">
                {TIMER_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option.label}
                    onPress={() => handleSelect(option.minutes)}
                    activeOpacity={0.7}
                    className={cn(
                      'flex-row items-center justify-between px-5 py-4',
                      index !== TIMER_OPTIONS.length - 1 &&
                        'border-b border-amber-200/50 dark:border-amber-700/50'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-base',
                        option.minutes === 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-900 dark:text-amber-100'
                      )}
                    >
                      {option.label}
                    </Text>
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
