import { useEffect, useState, useCallback } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth, getAuthErrorMessage } from '@/hooks/useAuth';

// Required for web browser redirect
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  disabled?: boolean;
  onError?: (error: string) => void;
}

export function GoogleSignInButton({ disabled, onError }: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Check if Google OAuth is configured
  const isGoogleConfigured = !!(
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  );

  // Configure Google OAuth - only if credentials are available
  const [request, response, promptAsync] = Google.useAuthRequest(
    isGoogleConfigured
      ? {
          clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
          androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        }
      : { clientId: 'not-configured' } // Dummy to prevent crash
  );

  const handleResponse = useCallback(async () => {
    if (response?.type === 'success') {
      setIsLoading(true);
      try {
        const { id_token } = response.params;

        if (!id_token) {
          onError?.('No ID token received from Google');
          return;
        }

        const { error } = await signInWithGoogle(id_token);

        if (error) {
          onError?.(getAuthErrorMessage(error));
        }
        // Success handled by auth state change
      } catch (err) {
        onError?.('Google Sign-In failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else if (response?.type === 'error') {
      onError?.('Google Sign-In was cancelled or failed.');
    }
  }, [response, signInWithGoogle, onError]);

  useEffect(() => {
    if (response) {
      handleResponse();
    }
  }, [response, handleResponse]);

  const handlePress = async () => {
    if (!isGoogleConfigured) {
      Alert.alert(
        'Google Sign-In Not Available',
        'Google Sign-In requires OAuth credentials to be configured.\n\nPlease use email/password sign-in or configure Google OAuth in your .env file.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!request) {
      Alert.alert(
        'Google Sign-In Not Available',
        'Google Sign-In requires a development build and is not available in Expo Go.\n\nPlease use email/password sign-in or build a development client.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await promptAsync();
    } catch (err) {
      onError?.('Failed to start Google Sign-In');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isLoading}
      className="bg-zinc-900 border border-zinc-700 py-4 rounded-xl flex-row justify-center items-center"
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="white" />
      ) : (
        <View className="flex-row items-center">
          <Ionicons name="logo-google" size={18} color="#ffffff" />
          <Text className="text-white font-semibold text-base ml-2">
            Continue with Google
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
