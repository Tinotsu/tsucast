/**
 * Track Player Service
 *
 * Handles audio player initialization and configuration.
 * Story: 3-3 Player Screen & Controls
 */

import TrackPlayer, {
  Capability,
  AppKilledPlaybackBehavior,
  RepeatMode,
} from 'react-native-track-player';

let isSetup = false;

/**
 * Initialize the track player with capabilities
 */
export async function setupPlayer(): Promise<boolean> {
  if (isSetup) {
    return true;
  }

  try {
    // Check if player is already initialized
    await TrackPlayer.getActiveTrack();
    isSetup = true;
    return true;
  } catch {
    // Player not initialized, set it up
    await TrackPlayer.setupPlayer({
      // Buffer settings for smooth playback
      minBuffer: 15,
      maxBuffer: 50,
      playBuffer: 2.5,
      backBuffer: 30,
    });

    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SeekTo,
        Capability.JumpForward,
        Capability.JumpBackward,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.JumpBackward,
        Capability.JumpForward,
      ],
      // Jump intervals
      forwardJumpInterval: 30,
      backwardJumpInterval: 15,
      // Android specific
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
      // Notification colors
      progressUpdateEventInterval: 1,
    });

    // Set repeat mode to off by default
    await TrackPlayer.setRepeatMode(RepeatMode.Off);

    isSetup = true;
    return true;
  }
}

/**
 * Check if player is initialized
 */
export function isPlayerSetup(): boolean {
  return isSetup;
}
