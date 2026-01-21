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
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth, getAuthErrorMessage } from '@/hooks/useAuth';
import { AppleSignInButton } from '@/components/auth/AppleSignInButton';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email');
      return false;
    }
    if (!password) {
      setError('Please enter your password');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    setError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(getAuthErrorMessage(signInError));
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
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="mb-10">
            <Text className="text-4xl font-bold text-white text-center">
              tsucast
            </Text>
            <Text className="text-zinc-400 text-center mt-2">
              Turn any article into a podcast
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
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white mb-4"
            placeholderTextColor="#71717a"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            editable={!isFormDisabled}
          />

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleSignIn}
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
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity className="py-3" disabled={isFormDisabled}>
              <Text className="text-zinc-400 text-center">
                Don't have an account?{' '}
                <Text className="font-semibold text-white">Sign up</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
