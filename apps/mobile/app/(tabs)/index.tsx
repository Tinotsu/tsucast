/**
 * Add Screen
 *
 * Main content generation screen.
 * Stories: 5-1 Free Tier, 5-2 Limit Display & Upgrade Prompt, 10-2 Mobile Credits
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
import { useAuth } from '@/hooks/useAuth';
import { PasteInput } from '../../components/add/PasteInput';
import { VoiceSelector } from '../../components/add/VoiceSelector';
import { GenerateButton } from '../../components/add/GenerateButton';
import { CreditBalance } from '../../components/ui/CreditBalance';
import { CreditPreview } from '../../components/add/CreditPreview';
import { CreditPurchaseModal } from '../../components/ui/CreditPurchaseModal';
import { isValidUrl, getUrlValidationError } from '../../utils/validation';
import { normalizeAndHashUrl } from '../../utils/urlNormalization';
import { trackEvent } from '@/services/posthog';
import { checkCache, CacheResult, previewGeneration, GenerationPreview } from '../../services/api';
import { useVoicePreference } from '../../hooks/useVoicePreference';
import { useSubscription } from '../../hooks/useSubscription';
import { useCredits } from '../../hooks/useCredits';

/**
 * Add Screen State Machine
 *
 * idle -> validating (on input change)
 * validating -> invalid (validation failed) OR checking_cache (validation passed)
 * checking_cache -> previewing (cache miss) OR cached (cache hit)
 * previewing -> ready_to_generate (preview complete)
 */
type AddScreenState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'invalid'; error: string }
  | { status: 'checking_cache' }
  | { status: 'previewing' }
  | { status: 'cached'; audioUrl: string; title: string; duration?: number }
  | { status: 'ready_to_generate'; normalizedUrl: string; urlHash: string; preview: GenerationPreview };

// Debounce delay for URL validation (ms)
const VALIDATION_DEBOUNCE_MS = 300;

export default function AddScreen() {
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized]);

  if (!isAuthenticated) return null;

  return <AddScreenContent />;
}

function AddScreenContent() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<AddScreenState>({ status: 'idle' });
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const { selectedVoiceId, setSelectedVoiceId } = useVoicePreference();
  const { isPro } = useSubscription();
  const { credits, timeBank, invalidate: invalidateCredits } = useCredits();

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
   * Process URL: validate, normalize, check cache, and preview credits
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
        return;
      }

      // Not cached - get credit preview (skip for Pro users who have unlimited)
      if (!isPro) {
        setState({ status: 'previewing' });
        try {
          const preview = await previewGeneration(trimmed, selectedVoiceId);
          setState({
            status: 'ready_to_generate',
            normalizedUrl: normalized,
            urlHash: hash,
            preview,
          });
        } catch {
          // Preview failed, use defaults
          setState({
            status: 'ready_to_generate',
            normalizedUrl: normalized,
            urlHash: hash,
            preview: {
              isCached: false,
              estimatedMinutes: 0,
              creditsNeeded: 1,
              currentCredits: credits,
              currentTimeBank: timeBank,
              hasSufficientCredits: credits >= 1,
            },
          });
        }
      } else {
        // Pro user - no credit check needed
        setState({
          status: 'ready_to_generate',
          normalizedUrl: normalized,
          urlHash: hash,
          preview: {
            isCached: false,
            estimatedMinutes: 0,
            creditsNeeded: 0,
            currentCredits: Infinity,
            currentTimeBank: 0,
            hasSufficientCredits: true,
          },
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('URL processing error:', error);
      }
      // On error, still allow generation with default preview
      setState({
        status: 'ready_to_generate',
        normalizedUrl: trimmed,
        urlHash: '',
        preview: {
          isCached: false,
          estimatedMinutes: 0,
          creditsNeeded: 1,
          currentCredits: credits,
          currentTimeBank: timeBank,
          hasSufficientCredits: credits >= 1,
        },
      });
    }
  }, [isPro, credits, timeBank, selectedVoiceId]);

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
    // Check credits before attempting generation (not cached content)
    if (state.status === 'ready_to_generate' && !isPro && !state.preview.hasSufficientCredits) {
      setShowPurchaseModal(true);
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
      trackEvent('article_submitted', { voice_id: selectedVoiceId });
      // TODO: Navigate to generation flow with normalizedUrl, urlHash, and selectedVoiceId
    }
  };

  /**
   * Handle credit pack purchase
   */
  const handlePurchase = async (packId: string) => {
    // TODO: Implement actual RevenueCat purchase
    if (__DEV__) {
      console.log('Purchasing pack:', packId);
    }
    // After purchase, invalidate credits to refetch
    invalidateCredits();
  };

  // Derived state for UI
  const isLoading = state.status === 'validating' || state.status === 'checking_cache' || state.status === 'previewing';
  const hasError = state.status === 'invalid';
  const isValid = state.status === 'ready_to_generate' || state.status === 'cached';
  const isCached = state.status === 'cached';
  const isPreviewing = state.status === 'previewing';
  const hasEnoughCredits = isPro || isCached || (state.status === 'ready_to_generate' && state.preview.hasSufficientCredits);
  const canGenerate = isValid && !isLoading;

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

            {/* Credit Balance for all users (Pro shows unlimited) */}
            {!isPro && (
              <CreditBalance
                credits={credits}
                timeBank={timeBank}
                onBuyPress={() => setShowPurchaseModal(true)}
              />
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

              {/* Credit Preview - shows after URL validation for non-Pro users */}
              {!isPro && (state.status === 'ready_to_generate' || state.status === 'previewing') && (
                <CreditPreview
                  estimatedMinutes={state.status === 'ready_to_generate' ? state.preview.estimatedMinutes : 0}
                  creditsNeeded={state.status === 'ready_to_generate' ? state.preview.creditsNeeded : 1}
                  isCached={false}
                  hasEnoughCredits={hasEnoughCredits}
                  isLoading={isPreviewing}
                />
              )}

              {/* Cached badge */}
              {isCached && (
                <CreditPreview
                  estimatedMinutes={0}
                  creditsNeeded={0}
                  isCached={true}
                  hasEnoughCredits={true}
                />
              )}
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

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        visible={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchase}
        currentCredits={credits}
      />
    </SafeAreaView>
  );
}
