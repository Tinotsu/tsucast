import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuth, getAuthErrorMessage } from '@/hooks/useAuth';
import { trackEvent } from '@/services/posthog';
import { AppleSignInButton } from '@/components/auth/AppleSignInButton';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export default function SignupScreen() {
  const { signUp, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Please enter a password');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    setError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { error: signUpError } = await signUp(email, password);

      if (signUpError) {
        setError(getAuthErrorMessage(signUpError));
      } else {
        trackEvent('user_signed_up', { method: 'email' });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const isFormDisabled = isSubmitting || isLoading;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-10">
            {/* Header */}
            <View className="mb-10">
              <Text className="text-4xl font-bold text-white text-center">
                Create Account
              </Text>
              <Text className="text-zinc-400 text-center mt-2">
                Start listening to articles today
              </Text>
            </View>

            {/* Social Sign-In Buttons */}
            <View className="mb-3">
              <AppleSignInButton
                disabled={isFormDisabled}
                onError={handleSocialError}
              />
            </View>

            <View className="mb-6">
              <GoogleSignInButton
                disabled={isFormDisabled}
                onError={handleSocialError}
              />
            </View>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-zinc-800" />
              <Text className="mx-4 text-zinc-500">or</Text>
              <View className="flex-1 h-px bg-zinc-800" />
            </View>

            {/* Error Message */}
            {error ? (
              <View className="border border-red-500/50 bg-red-500/10 p-3 rounded-xl mb-4">
                <Text className="text-red-400 text-center">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Email Input */}
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white mb-3"
              placeholderTextColor="#71717a"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isFormDisabled}
            />

            {/* Password Input */}
            <TextInput
              placeholder="Password (min 8 characters)"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white mb-4"
              placeholderTextColor="#71717a"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!isFormDisabled}
            />

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={isFormDisabled}
              className={`py-4 rounded-xl mb-4 ${
                isFormDisabled ? 'bg-zinc-700' : 'bg-white'
              }`}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className={`font-bold text-center text-lg ${
                  isFormDisabled ? 'text-zinc-400' : 'text-black'
                }`}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity className="py-3" disabled={isFormDisabled}>
                <Text className="text-zinc-400 text-center">
                  Already have an account?{' '}
                  <Text className="font-semibold text-white">Sign in</Text>
                </Text>
              </TouchableOpacity>
            </Link>

            {/* Terms */}
            <Text className="text-xs text-zinc-500 text-center mt-6">
              By creating an account, you agree to our{' '}
              <Text
                className="text-zinc-400 underline"
                onPress={() => Linking.openURL('https://tsucast.com/terms')}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                className="text-zinc-400 underline"
                onPress={() => Linking.openURL('https://tsucast.com/privacy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
