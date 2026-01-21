/**
 * ErrorState Component
 *
 * Displays extraction errors with report and dismiss options.
 * Story: 2-4 Extraction Error Reporting
 */

import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorStateProps {
  /** Error title (short description) */
  title: string;
  /** Detailed error message */
  message: string;
  /** Callback when user taps Report (parent should handle the actual reporting) */
  onReport: () => void;
  /** Callback when user taps Try Another */
  onDismiss: () => void;
  /** Whether report is being submitted */
  isReporting?: boolean;
  /** Whether report was successfully sent */
  reportSent?: boolean;
}

export function ErrorState({
  title,
  message,
  onReport,
  onDismiss,
  isReporting = false,
  reportSent = false,
}: ErrorStateProps) {
  return (
    <View className="p-5 bg-zinc-900 border border-red-500/30 rounded-2xl">
      {/* Error Icon and Title */}
      <View className="flex-row items-center mb-2">
        <View className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center mr-3">
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
        </View>
        <Text className="text-lg font-semibold text-white flex-1">{title}</Text>
      </View>

      {/* Error Message */}
      <Text className="text-zinc-400 mb-5 ml-11">{message}</Text>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        {/* Report Button */}
        {!reportSent ? (
          <TouchableOpacity
            onPress={onReport}
            disabled={isReporting}
            className="flex-1 flex-row items-center justify-center py-3 bg-zinc-800 rounded-xl"
            activeOpacity={0.7}
          >
            {isReporting ? (
              <ActivityIndicator size="small" color="#a1a1aa" />
            ) : (
              <>
                <Ionicons name="flag-outline" size={18} color="#a1a1aa" />
                <Text className="text-zinc-400 ml-2 font-medium">Report</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View className="flex-1 flex-row items-center justify-center py-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
            <Text className="text-green-500 ml-2 font-medium">Thanks!</Text>
          </View>
        )}

        {/* Try Another Button */}
        <TouchableOpacity
          onPress={onDismiss}
          className="flex-1 flex-row items-center justify-center py-3 bg-white rounded-xl"
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={18} color="#000" />
          <Text className="text-black ml-2 font-semibold">Try Another</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
