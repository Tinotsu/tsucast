/**
 * UpgradeBanner Component
 *
 * Gentle upgrade prompt shown occasionally to free users.
 * Story: 5-2 Limit Display & Upgrade Prompt
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface UpgradeBannerProps {
  message?: string;
}

export function UpgradeBanner({ message }: UpgradeBannerProps) {
  return (
    <TouchableOpacity
      onPress={() => router.push('/upgrade')}
      className="mx-4 mb-4 p-4 bg-amber-500 rounded-xl flex-row items-center"
      activeOpacity={0.8}
    >
      <View className="flex-1">
        <Text className="text-white font-bold">
          {message || 'Enjoying tsucast?'}
        </Text>
        <Text className="text-white/80 text-sm">
          Upgrade for unlimited articles
        </Text>
      </View>
      <Ionicons name="arrow-forward" size={24} color="white" />
    </TouchableOpacity>
  );
}
