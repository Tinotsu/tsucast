/**
 * Library Screen
 *
 * Displays free content samples for all users, plus personal library for authenticated users.
 * Stories: 4-1 Library View, 4-3 Playlist Management, 5-2 Limit Display & Upgrade Prompt
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { FreeContentSection } from '@/components/library/FreeContentSection';
import { PersonalLibrary } from '@/components/library/PersonalLibrary';

function SignUpPrompt() {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Ionicons name="library-outline" size={64} color="#D97706" />
      <Text className="mt-4 text-lg text-amber-900 dark:text-amber-100 text-center">
        Save your own podcasts
      </Text>
      <Text className="mt-2 text-amber-700 dark:text-amber-300 text-center">
        Sign up to generate and save articles as podcasts
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(auth)/login')}
        className="mt-6 bg-amber-500 px-6 py-3 rounded-full"
        activeOpacity={0.7}
      >
        <Text className="text-white font-semibold">Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LibraryScreen() {
  const { isAuthenticated } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown" edges={['top']}>
      <FreeContentSection />
      {isAuthenticated ? (
        <PersonalLibrary />
      ) : (
        <SignUpPrompt />
      )}
    </SafeAreaView>
  );
}
