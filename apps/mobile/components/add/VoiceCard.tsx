/**
 * Voice Card Component
 *
 * Individual voice option card with preview capability.
 * Story: 3-1 Voice Selection & Preview
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/utils/cn';
import type { Voice } from '../../constants/voices';

interface VoiceCardProps {
  voice: Voice;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPreview: () => void;
  disabled?: boolean;
}

export function VoiceCard({
  voice,
  isSelected,
  isPlaying,
  onSelect,
  onPreview,
  disabled = false,
}: VoiceCardProps) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
      className={cn(
        'mr-3 p-4 rounded-xl w-32 border-2',
        isSelected
          ? 'bg-amber-500 border-amber-600'
          : 'bg-zinc-900 border-zinc-800',
        disabled && 'opacity-50'
      )}
    >
      {/* Voice Name */}
      <Text className="font-semibold text-white">
        {voice.name}
      </Text>

      {/* Voice Style */}
      <Text
        className={cn(
          'text-xs mt-1',
          isSelected ? 'text-amber-100' : 'text-zinc-400'
        )}
      >
        {voice.style}
      </Text>

      {/* Preview Button */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation?.();
          onPreview();
        }}
        disabled={disabled}
        className="mt-3 flex-row items-center"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isPlaying ? 'stop-circle' : 'play-circle'}
          size={20}
          color={isSelected ? '#fff' : '#f59e0b'}
        />
        <Text
          className={cn(
            'text-xs ml-1',
            isSelected ? 'text-white' : 'text-amber-500'
          )}
        >
          {isPlaying ? 'Stop' : 'Preview'}
        </Text>
      </TouchableOpacity>

      {/* Selected Indicator */}
      {isSelected && (
        <View className="absolute top-2 right-2">
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}
