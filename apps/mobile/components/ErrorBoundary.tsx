/**
 * ErrorBoundary Component
 *
 * Catches unhandled React errors and displays a recovery UI.
 * Story: 6-1 Error Handling & User Feedback
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging (in production, send to error tracking service)
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // TODO: Send to Sentry when configured
    // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown">
          <View className="flex-1 items-center justify-center p-8">
            <View className="w-20 h-20 bg-red-100 dark:bg-red-900/50 rounded-full items-center justify-center mb-6">
              <Ionicons name="warning" size={40} color="#DC2626" />
            </View>

            <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100 text-center">
              Something went wrong
            </Text>

            <Text className="mt-3 text-zinc-600 dark:text-zinc-400 text-center">
              We're sorry for the inconvenience. Please try again or restart the app.
            </Text>

            {__DEV__ && this.state.error && (
              <View className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg max-w-full">
                <Text className="text-xs text-red-800 dark:text-red-200 font-mono">
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={this.handleRetry}
              className="mt-8 bg-amber-500 px-8 py-3 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
