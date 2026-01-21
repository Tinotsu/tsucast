/**
 * LimitModal Component
 *
 * Shows when user reaches daily generation limit.
 * Story: 5-2 Limit Display & Upgrade Prompt
 */

import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, differenceInHours } from 'date-fns';

interface LimitModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  resetAt?: string | null;
}

/**
 * Format time until reset in a friendly way
 */
function formatResetTime(resetAt: string): string {
  const resetDate = new Date(resetAt);
  const hoursUntil = differenceInHours(resetDate, new Date());

  if (hoursUntil < 1) {
    return 'in less than an hour';
  }

  return formatDistanceToNow(resetDate, { addSuffix: true });
}

const PRO_BENEFITS = ['Unlimited articles', 'All voices', 'Priority support'];

export function LimitModal({ visible, onClose, onUpgrade, resetAt }: LimitModalProps) {
  const timeUntilReset = resetAt ? formatResetTime(resetAt) : 'tomorrow';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black/50 items-center justify-center p-4">
        <View className="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-sm">
          {/* Illustration */}
          <View className="items-center mb-4">
            <View className="w-20 h-20 bg-amber-100 dark:bg-amber-900/50 rounded-full items-center justify-center">
              <Ionicons name="sparkles" size={40} color="#F59E0B" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100 text-center">
            You've used all your free articles today
          </Text>

          {/* Description */}
          <Text className="mt-3 text-zinc-600 dark:text-zinc-400 text-center">
            Upgrade to Pro for unlimited articles, or your limit resets {timeUntilReset}.
          </Text>

          {/* Buttons */}
          <View className="mt-6 gap-3">
            <TouchableOpacity
              onPress={onUpgrade}
              className="bg-amber-500 py-4 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-center text-lg">
                Upgrade for Unlimited
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} className="py-3" activeOpacity={0.7}>
              <Text className="text-amber-600 dark:text-amber-400 text-center">
                Come back tomorrow
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pro benefits */}
          <View className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-2">
              Pro includes:
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {PRO_BENEFITS.map((benefit) => (
                <View
                  key={benefit}
                  className="flex-row items-center bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full"
                >
                  <Ionicons name="checkmark" size={12} color="#F59E0B" />
                  <Text className="text-xs text-amber-700 dark:text-amber-300 ml-1">
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
