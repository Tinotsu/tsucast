import { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth, getAuthErrorMessage } from '@/hooks/useAuth';

interface AppleSignInButtonProps {
  disabled?: boolean;
  onError?: (error: string) => void;
}

export function AppleSignInButton({ disabled, onError }: AppleSignInButtonProps) {
  const { signInWithApple } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Only render on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handlePress = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithApple();

      if (error) {
        onError?.(getAuthErrorMessage(error));
      }
      // Success handled by auth state change
    } catch (err) {
      // Don't show error for user cancellation
      if ((err as any)?.code !== 'ERR_REQUEST_CANCELED') {
        onError?.('Apple Sign-In failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isLoading}
      className="bg-white py-4 rounded-xl flex-row justify-center items-center"
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="black" />
      ) : (
        <Text className="text-black font-semibold text-base">
           Continue with Apple
        </Text>
      )}
    </TouchableOpacity>
  );
}
