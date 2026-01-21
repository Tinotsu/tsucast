/**
 * Playback Service
 *
 * Background service for handling remote playback events.
 * Story: 3-3 Player Screen & Controls
 * Story: 4-2 Playback Progress Tracking
 */

import TrackPlayer, { Event } from 'react-native-track-player';
import { usePlayerStore } from '@/stores/playerStore';
import { updatePlaybackPosition } from '@/services/api';

/**
 * Remote playback event handlers
 * This service runs in the background and handles events from lock screen,
 * notification controls, and headphone buttons.
 */
export async function PlaybackService() {
  // Play event from remote control
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  // Pause event from remote control
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  // Seek event from remote control (scrubbing on lock screen)
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  // Jump forward event (from notification or headphones)
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async (event) => {
    const position = await TrackPlayer.getPosition();
    const duration = await TrackPlayer.getDuration();
    const jumpInterval = event.interval || 30;
    const newPosition = Math.min(position + jumpInterval, duration);
    await TrackPlayer.seekTo(newPosition);
  });

  // Jump backward event (from notification or headphones)
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (event) => {
    const position = await TrackPlayer.getPosition();
    const jumpInterval = event.interval || 15;
    const newPosition = Math.max(0, position - jumpInterval);
    await TrackPlayer.seekTo(newPosition);
  });

  // Handle playback ending - mark as played
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
    const { currentLibraryId } = usePlayerStore.getState();

    if (currentLibraryId) {
      try {
        const duration = await TrackPlayer.getDuration();
        await updatePlaybackPosition(currentLibraryId, Math.floor(duration), true);
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to mark as played:', error);
        }
      }
    }
  });

  // Handle playback errors
  TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
    if (__DEV__) {
      console.error('Playback error:', error);
    }
  });

  // Handle audio duck events (phone calls, other apps requesting audio focus)
  let wasPlayingBeforeDuck = false;
  let originalVolume = 1.0;

  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.permanent) {
      // Permanent interruption (headphones disconnected) - pause
      await TrackPlayer.pause();
    } else if (event.paused) {
      // Another app requested exclusive audio (phone call)
      const state = await TrackPlayer.getPlaybackState();
      wasPlayingBeforeDuck = state.state === 'playing';
      if (wasPlayingBeforeDuck) {
        await TrackPlayer.pause();
      }
    } else {
      // Interruption ended - restore volume and resume if we were playing
      await TrackPlayer.setVolume(originalVolume);
      if (wasPlayingBeforeDuck) {
        await TrackPlayer.play();
        wasPlayingBeforeDuck = false;
      }
    }
  });
}
