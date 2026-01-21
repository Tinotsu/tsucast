/**
 * Voice Selector Component
 *
 * Horizontal scrolling list of voice options with preview capability.
 * Story: 3-1 Voice Selection & Preview
 */

import { View, Text, ScrollView } from 'react-native';
import { VOICES } from '../../constants/voices';
import { VoiceCard } from './VoiceCard';
import { useVoicePreview } from '../../hooks/useVoicePreview';

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onVoiceSelect: (voiceId: string) => void;
  disabled?: boolean;
}

export function VoiceSelector({
  selectedVoiceId,
  onVoiceSelect,
  disabled = false,
}: VoiceSelectorProps) {
  const { playPreview, stopPreview, playingId } = useVoicePreview();

  const handlePreview = (voice: typeof VOICES[0]) => {
    if (disabled) return;
    playPreview(voice);
  };

  const handleSelect = (voiceId: string) => {
    if (disabled) return;
    // Stop any playing preview when selecting
    stopPreview();
    onVoiceSelect(voiceId);
  };

  return (
    <View>
      <Text className="text-zinc-500 text-sm uppercase tracking-wide mb-3">
        Voice
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {VOICES.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            isSelected={selectedVoiceId === voice.id}
            isPlaying={playingId === voice.id}
            onSelect={() => handleSelect(voice.id)}
            onPreview={() => handlePreview(voice)}
            disabled={disabled}
          />
        ))}
      </ScrollView>
    </View>
  );
}
