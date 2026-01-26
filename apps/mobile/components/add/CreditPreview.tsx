/**
 * CreditPreview Component
 *
 * Shows estimated credit cost before generation.
 * Story: 10-2 Mobile Article Credit Pricing
 */

import { View, Text, ActivityIndicator } from 'react-native';

interface CreditPreviewProps {
  estimatedMinutes: number;
  creditsNeeded: number;
  isCached: boolean;
  hasEnoughCredits: boolean;
  isLoading?: boolean;
}

export function CreditPreview({
  estimatedMinutes,
  creditsNeeded,
  isCached,
  hasEnoughCredits,
  isLoading = false,
}: CreditPreviewProps) {
  if (isLoading) {
    return (
      <View className="flex-row items-center gap-2 bg-zinc-900 rounded-lg p-3 mt-3">
        <ActivityIndicator size="small" color="#a1a1aa" />
        <Text className="text-zinc-400">Checking article...</Text>
      </View>
    );
  }

  if (isCached) {
    return (
      <View className="flex-row items-center gap-2 bg-green-900/30 border border-green-800/50 rounded-lg p-3 mt-3">
        <Text className="text-lg">✨</Text>
        <Text className="text-green-400 font-medium">
          Free! Already available
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-zinc-900 rounded-lg p-3 mt-3">
      <View className="flex-row justify-between items-center">
        <Text className="text-zinc-400">Est. duration</Text>
        <Text className="text-white font-medium">
          {estimatedMinutes} min
        </Text>
      </View>
      <View className="flex-row justify-between items-center mt-2">
        <Text className="text-zinc-400">Credits needed</Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-lg">🎫</Text>
          <Text
            className={`font-semibold ${
              hasEnoughCredits ? 'text-white' : 'text-red-400'
            }`}
          >
            {creditsNeeded} credit{creditsNeeded !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      {!hasEnoughCredits && (
        <Text className="text-red-400 text-sm mt-2">
          Not enough credits. Buy more to continue.
        </Text>
      )}
    </View>
  );
}
