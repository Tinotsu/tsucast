import { useEffect, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
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

  // Configure Google OAuth
  // Note: These client IDs need to be set up in Google Cloud Console
  // For development, you can use the Expo client ID
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Replace with your actual client IDs from Google Cloud Console
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    const handleResponse = async () => {
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
    };

    if (response) {
      handleResponse();
    }
  }, [response]);

  const handlePress = async () => {
    if (!request) {
      // Google OAuth not configured - check if it's a config issue vs Expo Go
      const isExpoGo = !process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      Alert.alert(
        'Google Sign-In Not Available',
        isExpoGo
          ? 'Google Sign-In requires OAuth credentials to be configured.\n\nPlease use email/password sign-in or configure Google OAuth in your .env file.'
          : 'Google Sign-In requires a development build and is not available in Expo Go.\n\nPlease use email/password sign-in or build a development client.',
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
      className="bg-white border border-gray-300 py-4 rounded-xl flex-row justify-center items-center"
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <Text className="text-gray-700 font-semibold text-base">
          Continue with Google
        </Text>
      )}
    </TouchableOpacity>
  );
}
