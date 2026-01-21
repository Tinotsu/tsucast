/**
 * LimitBanner Component
 *
 * Shows remaining daily generations for free users.
 * Story: 5-1 Free Tier Implementation
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface LimitBannerProps {
  used: number;
  limit: number;
  resetAt?: string | null;
}

export function LimitBanner({ used, limit }: LimitBannerProps) {
  const router = useRouter();
  const remaining = limit - used;
  const isLow = remaining <= 1;
  const isExhausted = remaining === 0;

  return (
    <View
      className={`px-4 py-3 rounded-xl mb-4 ${
        isExhausted
          ? 'bg-red-100 dark:bg-red-900/30'
          : isLow
            ? 'bg-orange-100 dark:bg-orange-900/30'
            : 'bg-amber-100 dark:bg-amber-900/30'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Ionicons
            name={isExhausted ? 'alert-circle' : isLow ? 'warning' : 'flash'}
            size={18}
            color={isExhausted ? '#DC2626' : isLow ? '#EA580C' : '#F59E0B'}
          />
          <Text
            className={`ml-2 text-sm font-medium ${
              isExhausted
                ? 'text-red-800 dark:text-red-200'
                : isLow
                  ? 'text-orange-800 dark:text-orange-200'
                  : 'text-amber-800 dark:text-amber-200'
            }`}
          >
            {isExhausted
              ? "You've reached today's limit"
              : `${remaining} of ${limit} generations left today`}
          </Text>
        </View>

        {isExhausted && (
          <TouchableOpacity
            onPress={() => router.push('/upgrade')}
            className="bg-amber-500 px-3 py-1.5 rounded-full ml-2"
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-medium">Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      <View className="mt-2 h-1.5 bg-amber-200 dark:bg-amber-800/50 rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${
            isExhausted ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-amber-500'
          }`}
          style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
        />
      </View>
    </View>
  );
}
