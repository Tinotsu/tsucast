# Story 3.1: Voice Selection & Preview

Status: ready-for-dev

## Story

As a user about to generate audio,
I want to select a voice that sounds good,
so that my listening experience is enjoyable.

## Acceptance Criteria

1. **AC1: Voice Options Display**
   - Given user is on Add screen with valid URL
   - When they view voice options
   - Then they see 3-5 voice choices with names
   - And one voice is pre-selected as default

2. **AC2: Voice Preview**
   - Given user wants to preview a voice
   - When they tap the preview button
   - Then a short sample plays from R2 (`/voices/{name}.mp3`)
   - And sample is < 5 seconds

3. **AC3: Voice Selection Persistence**
   - Given user selects a different voice
   - When they tap a voice option
   - Then that voice becomes selected
   - And selection persists for future generations

## Tasks / Subtasks

### Task 1: Voice Constants Configuration (AC: 1)
- [ ] 1.1 Create `constants/voices.ts`:
  ```typescript
  export interface Voice {
    id: string;
    name: string;
    description: string;
    gender: 'male' | 'female' | 'neutral';
    style: string;
    previewUrl: string;
    fishAudioId: string; // Fish Audio voice ID
  }

  export const VOICES: Voice[] = [
    {
      id: 'narrator-alex',
      name: 'Alex',
      description: 'Clear, professional narrator',
      gender: 'male',
      style: 'Narration',
      previewUrl: 'https://audio.tsucast.com/voices/alex.mp3',
      fishAudioId: 'fish_audio_voice_id_alex',
    },
    {
      id: 'narrator-sarah',
      name: 'Sarah',
      description: 'Warm, engaging storyteller',
      gender: 'female',
      style: 'Storytelling',
      previewUrl: 'https://audio.tsucast.com/voices/sarah.mp3',
      fishAudioId: 'fish_audio_voice_id_sarah',
    },
    {
      id: 'narrator-james',
      name: 'James',
      description: 'Deep, authoritative voice',
      gender: 'male',
      style: 'Documentary',
      previewUrl: 'https://audio.tsucast.com/voices/james.mp3',
      fishAudioId: 'fish_audio_voice_id_james',
    },
    // Add 2 more voices
  ];

  export const DEFAULT_VOICE_ID = 'narrator-alex';
  ```
- [ ] 1.2 Research and select actual Fish Audio voice IDs
- [ ] 1.3 Record or generate voice preview samples (< 5 seconds each)

### Task 2: Voice Preview Audio Files (AC: 2)
- [ ] 2.1 Generate voice preview samples using Fish Audio API
- [ ] 2.2 Upload previews to R2 at `/voices/{id}.mp3`:
  ```
  tsucast-audio/
  └── voices/
      ├── alex.mp3
      ├── sarah.mp3
      ├── james.mp3
      └── ...
  ```
- [ ] 2.3 Configure R2 public access for voice previews
- [ ] 2.4 Test preview URLs are accessible

### Task 3: Voice Selector Component (AC: 1, 2, 3)
- [ ] 3.1 Create `components/add/VoiceSelector.tsx`:
  ```typescript
  import { VOICES, Voice } from '@/constants/voices';

  interface VoiceSelectorProps {
    selectedVoiceId: string;
    onVoiceSelect: (voiceId: string) => void;
    disabled?: boolean;
  }

  export function VoiceSelector({
    selectedVoiceId,
    onVoiceSelect,
    disabled
  }: VoiceSelectorProps) {
    const [playingPreview, setPlayingPreview] = useState<string | null>(null);

    return (
      <View className="gap-2">
        <Text className="text-sm font-medium text-amber-900 dark:text-amber-100">
          Voice
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {VOICES.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              isSelected={selectedVoiceId === voice.id}
              isPlaying={playingPreview === voice.id}
              onSelect={() => onVoiceSelect(voice.id)}
              onPreview={() => handlePreview(voice)}
              disabled={disabled}
            />
          ))}
        </ScrollView>
      </View>
    );
  }
  ```

### Task 4: Voice Card Component (AC: 1, 2)
- [ ] 4.1 Create `components/add/VoiceCard.tsx`:
  ```typescript
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
    disabled
  }: VoiceCardProps) {
    return (
      <TouchableOpacity
        onPress={onSelect}
        disabled={disabled}
        className={cn(
          'mr-3 p-4 rounded-xl w-32',
          isSelected
            ? 'bg-amber-500 border-2 border-amber-600'
            : 'bg-amber-100 dark:bg-amber-900 border-2 border-transparent'
        )}
      >
        <Text className={cn(
          'font-semibold',
          isSelected ? 'text-white' : 'text-amber-900 dark:text-amber-100'
        )}>
          {voice.name}
        </Text>
        <Text className={cn(
          'text-xs mt-1',
          isSelected ? 'text-amber-100' : 'text-amber-700 dark:text-amber-300'
        )}>
          {voice.style}
        </Text>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="mt-2 flex-row items-center"
        >
          <Ionicons
            name={isPlaying ? 'stop-circle' : 'play-circle'}
            size={20}
            color={isSelected ? '#fff' : '#d97706'}
          />
          <Text className={cn(
            'text-xs ml-1',
            isSelected ? 'text-white' : 'text-amber-600'
          )}>
            Preview
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }
  ```

### Task 5: Voice Preview Playback (AC: 2)
- [ ] 5.1 Create `hooks/useVoicePreview.ts`:
  ```typescript
  import { Audio } from 'expo-av';

  export function useVoicePreview() {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    const playPreview = async (voice: Voice) => {
      // Stop any current preview
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // If same voice, just stop
      if (playingId === voice.id) {
        setPlayingId(null);
        setSound(null);
        return;
      }

      // Play new preview
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: voice.previewUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingId(voice.id);

      // Auto-stop when finished
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingId(null);
        }
      });
    };

    const stopPreview = async () => {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingId(null);
      }
    };

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (sound) {
          sound.unloadAsync();
        }
      };
    }, [sound]);

    return { playPreview, stopPreview, playingId };
  }
  ```
- [ ] 5.2 Install expo-av if not already installed:
  ```bash
  npx expo install expo-av
  ```

### Task 6: Voice Selection Persistence (AC: 3)
- [ ] 6.1 Create `hooks/useVoicePreference.ts`:
  ```typescript
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { DEFAULT_VOICE_ID } from '@/constants/voices';

  const VOICE_PREFERENCE_KEY = 'selected_voice_id';

  export function useVoicePreference() {
    const [selectedVoiceId, setSelectedVoiceIdState] = useState(DEFAULT_VOICE_ID);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load on mount
    useEffect(() => {
      AsyncStorage.getItem(VOICE_PREFERENCE_KEY).then((stored) => {
        if (stored) {
          setSelectedVoiceIdState(stored);
        }
        setIsLoaded(true);
      });
    }, []);

    const setSelectedVoiceId = async (voiceId: string) => {
      setSelectedVoiceIdState(voiceId);
      await AsyncStorage.setItem(VOICE_PREFERENCE_KEY, voiceId);
    };

    return { selectedVoiceId, setSelectedVoiceId, isLoaded };
  }
  ```
- [ ] 6.2 Export voice ID for use in generation request

### Task 7: Integration with Add Screen (AC: all)
- [ ] 7.1 Update `app/(tabs)/index.tsx` to include VoiceSelector:
  ```typescript
  const { selectedVoiceId, setSelectedVoiceId } = useVoicePreference();

  return (
    <View>
      <PasteInput ... />
      <VoiceSelector
        selectedVoiceId={selectedVoiceId}
        onVoiceSelect={setSelectedVoiceId}
        disabled={isGenerating}
      />
      <GenerateButton
        onPress={() => handleGenerate(url, selectedVoiceId)}
        ...
      />
    </View>
  );
  ```
- [ ] 7.2 Pass selected voice ID to generate function
- [ ] 7.3 Stop voice preview when starting generation

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Voice previews stored in R2 at `/voices/`
- Fish Audio voice IDs stored in constants
- Voice selection persisted in AsyncStorage (not synced)
- expo-av for preview playback (not track-player)

**From UX Design Specification:**
- Voice selection visible but optional
- Default voice works well (no configuration needed)
- 3-5 voices maximum (avoid choice paralysis)
- Horizontal scroll for voice cards

### Source Tree Components

```
apps/mobile/
├── app/(tabs)/
│   └── index.tsx            # Voice selector integration
├── components/add/
│   ├── VoiceSelector.tsx    # Voice list component
│   └── VoiceCard.tsx        # Individual voice card
├── hooks/
│   ├── useVoicePreview.ts   # Preview playback logic
│   └── useVoicePreference.ts # Persistence
└── constants/
    └── voices.ts            # Voice definitions

R2 Storage:
└── voices/
    ├── alex.mp3
    ├── sarah.mp3
    └── james.mp3
```

### Testing Standards

- Test voice selection → card highlighted
- Test voice preview → audio plays
- Test preview stop → audio stops
- Test selection persistence → survives app restart
- Test default selection → first voice pre-selected
- Test disabled state during generation

### Key Technical Decisions

1. **expo-av for Previews:** Simpler than track-player for short clips
2. **AsyncStorage for Preference:** Local-only, no sync needed
3. **Horizontal Scroll:** Fits 3-5 voices without taking too much space
4. **Fish Audio IDs:** Map to actual voice IDs from provider

### Dependencies

- Story 2-1 must be completed (Add screen exists)
- R2 bucket must be configured with voice samples
- Fish Audio account needed for voice IDs

### References

- [Source: architecture-v2.md#R2-Storage-Structure]
- [Source: epics.md#Story-3.1-Voice-Selection-Preview]
- [Source: prd.md#FR6-FR9]
- [Source: ux-design-specification.md#Custom-Components]
- [expo-av Documentation](https://docs.expo.dev/versions/latest/sdk/av/)
- [Fish Audio API](https://fish.audio)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
