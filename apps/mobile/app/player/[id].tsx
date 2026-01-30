/**
 * Player Screen
 *
 * Full-screen audio player with controls.
 * Story: 3-3 Player Screen & Controls
 * Story: 3-5 Playback Speed Control
 * Story: 3-6 Sleep Timer
 * Story: 4-2 Playback Progress Tracking
 * Story: 4-4 Queue Management
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { usePlaybackSpeed } from '@/hooks/usePlaybackSpeed';
import { useSleepTimer } from '@/hooks/useSleepTimer';
import { usePositionSaving } from '@/hooks/usePositionSaving';
import { useQueue } from '@/hooks/useQueue';
import { PlayButton, SkipButton, ProgressBar, SpeedControl, SleepTimer, QueueButton, QueueSheet, Transcript } from '@/components/player';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showQueue, setShowQueue] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const {
    currentTrack,
    isPlaying,
    isLoading,
    position,
    duration,
    play,
    pause,
    skipForward,
    skipBackward,
    seekTo,
  } = useAudioPlayer();

  const { speed, setSpeed } = usePlaybackSpeed();

  const {
    remainingSeconds,
    endOfArticle,
    setTimer,
    cancelTimer,
    isActive: sleepTimerActive,
  } = useSleepTimer();

  const { queueLength } = useQueue();

  // Position saving - saves automatically during playback
  const { saveOnPause } = usePositionSaving();

  // Enhanced pause handler that saves position
  const handlePause = async () => {
    await pause();
    await saveOnPause();
  };

  const handleTogglePlayPause = async () => {
    if (isPlaying) {
      await handlePause();
    } else {
      await play();
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 -ml-2"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-down" size={28} color="#92400E" />
        </TouchableOpacity>

        <Text className="text-amber-800 dark:text-amber-200 font-medium">
          {showTranscript ? 'Transcript' : 'Now Playing'}
        </Text>

        {/* Transcript toggle (only show if transcript available) */}
        <TouchableOpacity
          onPress={() => setShowTranscript(!showTranscript)}
          className="p-2 -mr-2"
          accessibilityLabel={showTranscript ? 'Hide transcript' : 'Show transcript'}
          accessibilityRole="button"
          disabled={!currentTrack?.transcriptUrl}
          style={{ opacity: currentTrack?.transcriptUrl ? 1 : 0.3 }}
        >
          <Ionicons
            name={showTranscript ? 'musical-notes' : 'document-text'}
            size={24}
            color="#92400E"
          />
        </TouchableOpacity>
      </View>

      {/* Album Art or Transcript */}
      {showTranscript && currentTrack?.transcriptUrl ? (
        <View className="flex-1">
          <Transcript
            transcriptUrl={currentTrack.transcriptUrl}
            currentPosition={position}
            onSeek={seekTo}
          />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-72 h-72 bg-amber-100 dark:bg-amber-900/30 rounded-3xl items-center justify-center shadow-lg">
            <View className="w-48 h-48 bg-amber-200 dark:bg-amber-800/50 rounded-2xl items-center justify-center">
              <Ionicons name="musical-notes" size={80} color="#F59E0B" />
            </View>
          </View>
        </View>
      )}

      {/* Track Info */}
      <View className="px-8 mb-6">
        <Text
          className="text-2xl font-bold text-amber-900 dark:text-amber-100 text-center"
          numberOfLines={2}
        >
          {currentTrack?.title || 'No track playing'}
        </Text>
        {currentTrack?.sourceUrl && (
          <Text
            className="text-sm text-amber-600 dark:text-amber-400 text-center mt-2"
            numberOfLines={1}
          >
            {new URL(currentTrack.sourceUrl).hostname}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      <ProgressBar
        position={position}
        duration={duration}
        onSeek={seekTo}
        disabled={!currentTrack}
      />

      {/* Controls Row */}
      <View className="flex-row items-center justify-between px-6 py-6 pb-10">
        {/* Speed Control */}
        <SpeedControl
          currentSpeed={speed}
          onSpeedChange={setSpeed}
          disabled={!currentTrack}
        />

        {/* Main Controls */}
        <View className="flex-row items-center gap-6">
          <SkipButton
            direction="backward"
            onPress={() => skipBackward(15)}
            disabled={!currentTrack}
          />
          <PlayButton
            isPlaying={isPlaying}
            isLoading={isLoading}
            onPress={handleTogglePlayPause}
            disabled={!currentTrack}
          />
          <SkipButton
            direction="forward"
            onPress={() => skipForward(30)}
            disabled={!currentTrack}
          />
        </View>

        {/* Sleep Timer */}
        <SleepTimer
          remainingSeconds={remainingSeconds}
          endOfArticle={endOfArticle}
          onSetTimer={setTimer}
          onCancelTimer={cancelTimer}
          disabled={!currentTrack}
        />
      </View>

      {/* Secondary Controls Row */}
      <View className="flex-row items-center justify-center px-6 pb-4">
        <QueueButton
          queueLength={queueLength}
          onPress={() => setShowQueue(true)}
        />
      </View>

      {/* Sleep Timer Indicator */}
      {sleepTimerActive && (
        <View className="items-center pb-4">
          <Text className="text-sm text-amber-600 dark:text-amber-400">
            {endOfArticle
              ? 'Sleep: End of article'
              : `Sleep in ${Math.ceil((remainingSeconds ?? 0) / 60)} min`}
          </Text>
        </View>
      )}

      {/* Queue Sheet */}
      <QueueSheet
        visible={showQueue}
        onClose={() => setShowQueue(false)}
      />
    </SafeAreaView>
  );
}
