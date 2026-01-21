import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GenerateButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  isCached?: boolean;
}

/**
 * Generate Button Component
 *
 * Primary action button for the Add screen.
 * Shows different states:
 * - Disabled (gray): URL not valid or loading
 * - Loading: Shows spinner during validation/cache check
 * - Generate (white): Ready to start generation
 * - Play Now (white): Cached audio available
 */
export function GenerateButton({
  onPress,
  disabled = false,
  isLoading = false,
  isCached = false,
}: GenerateButtonProps) {
  const canPress = !disabled && !isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!canPress}
      className={`py-4 rounded-xl flex-row items-center justify-center ${
        canPress ? 'bg-white' : 'bg-zinc-800'
      }`}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#71717a" />
      ) : (
        <>
          <Ionicons
            name={isCached ? 'play' : 'sparkles'}
            size={20}
            color={canPress ? '#000000' : '#71717a'}
          />
          <Text
            className={`font-bold text-lg ml-2 ${
              canPress ? 'text-black' : 'text-zinc-500'
            }`}
          >
            {isCached ? 'Play Now' : 'Generate'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
