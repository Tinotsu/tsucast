/**
 * CreditBalance Component
 *
 * Displays user's credit balance with optional time bank and buy button.
 * Story: 10-2 Mobile Article Credit Pricing
 */

import { View, Text, Pressable } from 'react-native';

interface CreditBalanceProps {
  credits: number;
  timeBank: number;
  onBuyPress: () => void;
  compact?: boolean;
}

export function CreditBalance({
  credits,
  timeBank,
  onBuyPress,
  compact = false,
}: CreditBalanceProps) {
  if (compact) {
    return (
      <Pressable
        onPress={onBuyPress}
        className="flex-row items-center gap-1.5 bg-zinc-900 rounded-lg px-3 py-1.5"
      >
        <Text className="text-base">🎫</Text>
        <Text className="text-sm font-medium text-white">{credits}</Text>
        {timeBank > 0 && (
          <Text className="text-xs text-zinc-400">+{timeBank}m</Text>
        )}
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center justify-between bg-zinc-900 rounded-xl p-4 mb-4">
      <View className="flex-row items-center gap-3">
        <Text className="text-2xl">🎫</Text>
        <View>
          <Text className="text-lg font-semibold text-white">
            {credits} credit{credits !== 1 ? 's' : ''}
          </Text>
          {timeBank > 0 && (
            <Text className="text-sm text-zinc-400">
              +{timeBank} min banked
            </Text>
          )}
        </View>
      </View>
      <Pressable
        onPress={onBuyPress}
        className="bg-amber-600 active:bg-amber-700 px-4 py-2 rounded-lg"
      >
        <Text className="text-white font-medium">Buy More</Text>
      </Pressable>
    </View>
  );
}
