import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Voice option type
 * Will be expanded in Story 3.1
 */
export interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

/**
 * Default voice for MVP
 */
export const DEFAULT_VOICE: VoiceOption = {
  id: 'default',
  name: 'Default Voice',
  description: 'Natural, clear narration',
};

interface VoiceSelectorProps {
  selectedVoice?: VoiceOption;
  onSelectVoice?: (voice: VoiceOption) => void;
  disabled?: boolean;
}

/**
 * Voice Selector Component
 *
 * Placeholder for Story 3.1 - Voice Selection.
 * Currently shows a single default voice option.
 */
export function VoiceSelector({
  selectedVoice = DEFAULT_VOICE,
  onSelectVoice,
  disabled = true,
}: VoiceSelectorProps) {
  const handlePress = () => {
    if (!disabled && onSelectVoice) {
      // In Story 3.1, this will open a voice selection modal
      if (__DEV__) {
        console.log('Voice selector pressed');
      }
    }
  };

  return (
    <View>
      <Text className="text-zinc-500 text-sm uppercase tracking-wide mb-2">
        Voice
      </Text>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-row items-center justify-between ${
          disabled ? 'opacity-60' : ''
        }`}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
            <Ionicons name="mic" size={20} color="#71717a" />
          </View>
          <View className="ml-3">
            <Text className="text-white font-medium">{selectedVoice.name}</Text>
            <Text className="text-zinc-500 text-sm">{selectedVoice.description}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#71717a" />
      </TouchableOpacity>
      {disabled && (
        <Text className="text-zinc-600 text-xs mt-1 ml-1">
          More voices coming soon
        </Text>
      )}
    </View>
  );
}
