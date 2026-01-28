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
import { checkCache, CacheResult, previewGeneration, GenerationPreview, startStream } from '../../services/api';
import { useVoicePreference } from '../../hooks/useVoicePreference';
import { useSubscription } from '../../hooks/useSubscription';
import { useCredits } from '../../hooks/useCredits';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

/**
 * Add Screen State Machine
 *
 * idle -> validating (on input change)
 * validating -> invalid (validation failed) OR checking_cache (validation passed)
 * checking_cache -> previewing (cache miss) OR cached (cache hit)
 * previewing -> ready_to_generate (preview complete)
 * ready_to_generate -> generating (on generate press)
 * generating -> idle (success, navigated to player) OR invalid (error)
 */
type AddScreenState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'invalid'; error: string }
  | { status: 'checking_cache' }
  | { status: 'previewing' }
  | { status: 'cached'; audioUrl: string; title: string; duration?: number }
  | { status: 'ready_to_generate'; normalizedUrl: string; urlHash: string; preview: GenerationPreview }
  | { status: 'generating'; message: string };

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
  const { loadTrack } = useAudioPlayer();

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
   * Calls the streaming API and starts playback immediately
   */
  const handleGenerate = async () => {
    // Check credits before attempting generation (not cached content)
    if (state.status === 'ready_to_generate' && !isPro && !state.preview.hasSufficientCredits) {
      setShowPurchaseModal(true);
      return;
    }

    if (state.status === 'cached') {
      // Play cached audio immediately
      const trackId = `cached-${Date.now()}`;
      try {
        await loadTrack({
          id: trackId,
          audioUrl: state.audioUrl,
          title: state.title,
          duration: state.duration,
        });
        trackEvent('article_played', { source: 'cached' });
        // Reset state after successful load
        setUrl('');
        setState({ status: 'idle' });
        // Navigate to player screen
        router.push(`/player/${trackId}`);
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to play cached audio:', error);
        }
        setState({ status: 'invalid', error: 'Failed to play audio' });
      }
    } else if (state.status === 'ready_to_generate') {
      // Start streaming generation
      setState({ status: 'generating', message: 'Generating audio...' });
      trackEvent('article_submitted', { voice_id: selectedVoiceId });

      try {
        const result = await startStream(url, selectedVoiceId);
        let trackId: string;

        if (result.status === 'ready') {
          // Short article or already cached - play immediately
          trackId = result.streamId || `ready-${Date.now()}`;
          await loadTrack({
            id: trackId,
            audioUrl: result.audioUrl!,
            title: result.title || 'Untitled',
            duration: result.duration,
            wordCount: result.wordCount,
          });
          trackEvent('article_generated', {
            streaming: false,
            cached: result.cached ?? false,
            word_count: result.wordCount ?? 0,
          });
        } else if (result.status === 'streaming') {
          // HLS streaming - play manifest immediately while chunks generate
          trackId = result.streamId!;
          await loadTrack({
            id: trackId,
            audioUrl: result.manifestUrl!, // HLS manifest URL
            title: result.title || 'Untitled',
            duration: result.estimatedDuration,
          });
          trackEvent('stream_started', {
            stream_id: result.streamId ?? '',
            total_chunks: result.totalChunks ?? 0,
            estimated_duration: result.estimatedDuration ?? 0,
          });
        } else {
          throw new Error('Unexpected response status');
        }

        // Invalidate credits to refetch new balance
        invalidateCredits();

        // Reset state and navigate to player
        setUrl('');
        setState({ status: 'idle' });
        router.push(`/player/${trackId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Generation failed';

        if (errorMessage === 'INSUFFICIENT_CREDITS') {
          setShowPurchaseModal(true);
          setState({ status: 'invalid', error: 'Insufficient credits' });
        } else {
          setState({ status: 'invalid', error: errorMessage });
        }

        trackEvent('generation_failed', { error: errorMessage });
      }
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
  const isGenerating = state.status === 'generating';
  const isLoading = state.status === 'validating' || state.status === 'checking_cache' || state.status === 'previewing' || isGenerating;
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
