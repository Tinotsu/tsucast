/**
 * Re-export useAudioPlayer hook for easier importing
 *
 * Usage:
 *   import { useAudioPlayer } from "@/hooks/useAudioPlayer";
 *   const { state, play, pause, togglePlay } = useAudioPlayer();
 */
export {
  useAudioPlayer,
  useAudioPlayerOptional,
} from "@/providers/AudioPlayerProvider";
