/**
 * Add Screen
 *
 * Main content generation screen.
 * Stories: 5-1 Free Tier, 5-2 Limit Display & Upgrade Prompt
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PasteInput } from '../../components/add/PasteInput';
import { VoiceSelector } from '../../components/add/VoiceSelector';
import { GenerateButton } from '../../components/add/GenerateButton';
import { LimitBanner } from '../../components/ui/LimitBanner';
import { LimitModal } from '../../components/ui/LimitModal';
import { isValidUrl, getUrlValidationError } from '../../utils/validation';
import { normalizeAndHashUrl } from '../../utils/urlNormalization';
import { checkCache, CacheResult } from '../../services/api';
import { useVoicePreference } from '../../hooks/useVoicePreference';
import { useSubscription } from '../../hooks/useSubscription';

/**
 * Add Screen State Machine
 *
 * idle -> validating (on input change)
 * validating -> invalid (validation failed) OR checking_cache (validation passed)
 * checking_cache -> cached (found) OR ready_to_generate (not found)
 */
type AddScreenState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'invalid'; error: string }
  | { status: 'checking_cache' }
  | { status: 'cached'; audioUrl: string; title: string; duration?: number }
  | { status: 'ready_to_generate'; normalizedUrl: string; urlHash: string };

// Debounce delay for URL validation (ms)
const VALIDATION_DEBOUNCE_MS = 300;

export default function AddScreen() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<AddScreenState>({ status: 'idle' });
  const [showLimitModal, setShowLimitModal] = useState(false);
  const { selectedVoiceId, setSelectedVoiceId } = useVoicePreference();
  const { isPro, used, limit, remaining, resetAt } = useSubscription();

  // Ref to track validation timeout for debouncing
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Process URL: validate, normalize, and check cache
   */
  const processUrl = useCallback(async (text: string) => {
    const trimmed = text.trim();

    // Empty input -> idle
    if (!trimmed) {
      setState({ status: 'idle' });
      return;
    }

    // Start validating
    setState({ status: 'validating' });

    // Check if valid URL
    const validationError = getUrlValidationError(trimmed);
    if (validationError || !isValidUrl(trimmed)) {
      setState({
        status: 'invalid',
        error: validationError || 'Please enter a valid URL',
      });
      return;
    }

    // URL is valid, check cache
    setState({ status: 'checking_cache' });

    try {
      // Normalize URL and generate hash
      const { normalized, hash } = await normalizeAndHashUrl(trimmed);

      // Check if cached
      const cacheResult: CacheResult = await checkCache(hash);

      if (cacheResult.cached && cacheResult.audioUrl) {
        setState({
          status: 'cached',
          audioUrl: cacheResult.audioUrl,
          title: cacheResult.title || 'Untitled',
          duration: cacheResult.duration,
        });
      } else {
        setState({
          status: 'ready_to_generate',
          normalizedUrl: normalized,
          urlHash: hash,
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('URL processing error:', error);
      }
      // On error, still allow generation
      setState({
        status: 'ready_to_generate',
        normalizedUrl: trimmed,
        urlHash: '',
      });
    }
  }, []);

  /**
   * Handle URL input changes with debouncing
   */
  const handleUrlChange = useCallback(
    (text: string) => {
      setUrl(text);

      // Clear any pending validation
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }

      // Debounce the validation
      validationTimeoutRef.current = setTimeout(() => {
        processUrl(text);
      }, VALIDATION_DEBOUNCE_MS);
    },
    [processUrl]
  );

  /**
   * Handle generate button press
   */
  const handleGenerate = () => {
    // Check limit before attempting generation (not cached content)
    if (state.status === 'ready_to_generate' && !isPro && remaining <= 0) {
      setShowLimitModal(true);
      return;
    }

    if (state.status === 'cached') {
      // Navigate to player with cached audio
      if (__DEV__) {
        console.log('Playing cached audio:', state.audioUrl);
      }
      // TODO: Navigate to player screen with audioUrl
    } else if (state.status === 'ready_to_generate') {
      // Navigate to generation flow
      if (__DEV__) {
        console.log('Starting generation for:', state.normalizedUrl, 'with voice:', selectedVoiceId);
      }
      // TODO: Navigate to generation flow with normalizedUrl, urlHash, and selectedVoiceId
    }
  };

  /**
   * Handle upgrade navigation from limit modal
   */
  const handleUpgrade = () => {
    setShowLimitModal(false);
    router.push('/upgrade');
  };

  // Derived state for UI
  const isLoading = state.status === 'validating' || state.status === 'checking_cache';
  const hasError = state.status === 'invalid';
  const isValid = state.status === 'ready_to_generate' || state.status === 'cached';
  const isAtLimit = !isPro && remaining <= 0;
  const canGenerate = isValid && !isLoading && !isAtLimit;
  const isCached = state.status === 'cached';

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-4 pb-6">
            {/* Header */}
            <Text className="text-2xl font-bold text-white mb-2">
              Add Content
            </Text>
            <Text className="text-zinc-400 mb-4">
              Paste any article URL to turn it into a podcast
            </Text>

            {/* Limit Banner for free users */}
            {!isPro && (
              <LimitBanner used={used} limit={limit} />
            )}

            {/* Paste Input Area - 60% of available space */}
            <View className="flex-[3]">
              <PasteInput
                value={url}
                onChangeText={handleUrlChange}
                error={hasError ? state.error : undefined}
                isLoading={isLoading}
                isValid={isValid}
                isCached={isCached}
              />
            </View>

            {/* Voice Selector */}
            <View className="my-4">
              <VoiceSelector
                selectedVoiceId={selectedVoiceId}
                onVoiceSelect={setSelectedVoiceId}
                disabled={isLoading}
              />
            </View>

            {/* Generate Button */}
            <View className="mt-auto pt-4">
              <GenerateButton
                onPress={handleGenerate}
                disabled={!canGenerate}
                isLoading={isLoading}
                isCached={isCached}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Limit Modal */}
      <LimitModal
        visible={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={handleUpgrade}
        resetAt={resetAt}
      />
    </SafeAreaView>
  );
}
