import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth, getAuthErrorMessage } from '@/hooks/useAuth';
import { AppleSignInButton } from '@/components/auth/AppleSignInButton';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export default function SignupScreen() {
  const { signUp, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    if (password !== confirmPassword) {
      setError('Passwords do not match');
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
      }
      // Success - navigation handled by auth state change in root layout
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
    <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown">
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
              <Text className="text-4xl font-bold text-amber-900 dark:text-amber-100 text-center">
                Create Account
              </Text>
              <Text className="text-amber-600 dark:text-amber-400 text-center mt-2">
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
              <View className="flex-1 h-px bg-amber-300 dark:bg-amber-700" />
              <Text className="mx-4 text-amber-600 dark:text-amber-400">or</Text>
              <View className="flex-1 h-px bg-amber-300 dark:bg-amber-700" />
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl mb-4">
                <Text className="text-red-600 dark:text-red-400 text-center">
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
              className="bg-amber-100 dark:bg-amber-900 p-4 rounded-xl text-amber-900 dark:text-amber-100 mb-3"
              placeholderTextColor="#92400E"
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
              className="bg-amber-100 dark:bg-amber-900 p-4 rounded-xl text-amber-900 dark:text-amber-100 mb-3"
              placeholderTextColor="#92400E"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!isFormDisabled}
            />

            {/* Confirm Password Input */}
            <TextInput
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError('');
              }}
              className="bg-amber-100 dark:bg-amber-900 p-4 rounded-xl text-amber-900 dark:text-amber-100 mb-4"
              placeholderTextColor="#92400E"
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
                isFormDisabled ? 'bg-amber-400' : 'bg-amber-500'
              }`}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-center text-lg">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity className="py-3" disabled={isFormDisabled}>
                <Text className="text-amber-600 dark:text-amber-400 text-center">
                  Already have an account?{' '}
                  <Text className="font-semibold">Sign in</Text>
                </Text>
              </TouchableOpacity>
            </Link>

            {/* Terms */}
            <Text className="text-xs text-amber-500 text-center mt-6">
              By creating an account, you agree to our Terms of Service and
              Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
