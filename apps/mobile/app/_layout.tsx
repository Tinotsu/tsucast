import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/services/queryClient';
import { setupPlayer } from '@/services/trackPlayer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { toastConfig } from '@/components/ui/Toast';
import { MiniPlayer } from '@/components/player/MiniPlayer';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Auth navigation handler component
function AuthNavigationHandler({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and not on auth screen -> redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but on auth screen -> redirect to main app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, segments]);

  // Show loading spinner while checking auth state
  if (!isInitialized) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize audio player
        await setupPlayer();
      } catch (e) {
        if (__DEV__) console.warn('Error during app initialization:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <AuthNavigationHandler>
              <View className="flex-1 bg-black">
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="player/[id]"
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      gestureEnabled: true,
                      gestureDirection: 'vertical',
                    }}
                  />
                  <Stack.Screen
                    name="upgrade"
                    options={{
                      headerShown: true,
                      title: 'Upgrade to Pro',
                      headerStyle: { backgroundColor: '#000000' },
                      headerTintColor: '#ffffff',
                    }}
                  />
                </Stack>
                <MiniPlayer />
                <StatusBar style="light" />
              </View>
            </AuthNavigationHandler>
            <Toast config={toastConfig} />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
