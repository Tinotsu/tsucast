/**
 * useAudioPlayer hook
 *
 * Provides access to the global audio player state and controls.
 * Audio playback persists across page navigation.
 */

export { useAudioPlayer } from "@/providers/AudioPlayerProvider";
export type { AudioTrack, AudioState } from "@/services/audio-service";
