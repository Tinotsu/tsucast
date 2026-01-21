/**
 * Audio Player Hook
 *
 * Provides audio playback controls and state.
 * Story: 3-3 Player Screen & Controls
 */

import { useEffect, useCallback } from 'react';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
  useActiveTrack,
} from 'react-native-track-player';
import { usePlayerStore, Track } from '@/stores/playerStore';
import type { LibraryItem } from '@/services/api';
import type { PlaylistItem } from '@/hooks/usePlaylists';

export function useAudioPlayer() {
  const playbackState = usePlaybackState();
  const progress = useProgress(250); // Update every 250ms
  const activeTrack = useActiveTrack();

  const {
    currentTrack,
    isLoading,
    playbackSpeed,
    setCurrentTrack,
    setCurrentLibraryId,
    setIsPlaying,
    setIsLoading,
    setPosition,
    setDuration,
    setBuffered,
  } = usePlayerStore();

  // Derive isPlaying from playback state
  const isPlaying = playbackState.state === State.Playing;
  const isBuffering =
    playbackState.state === State.Buffering ||
    playbackState.state === State.Loading;

  // Sync playback state to store
  useEffect(() => {
    setIsPlaying(isPlaying);
    setIsLoading(isBuffering);
  }, [isPlaying, isBuffering, setIsPlaying, setIsLoading]);

  // Sync progress to store
  useEffect(() => {
    setPosition(progress.position);
    setDuration(progress.duration);
    setBuffered(progress.buffered);
  }, [progress.position, progress.duration, progress.buffered, setPosition, setDuration, setBuffered]);

  /**
   * Play audio
   */
  const play = useCallback(async () => {
    await TrackPlayer.play();
  }, []);

  /**
   * Pause audio
   */
  const pause = useCallback(async () => {
    await TrackPlayer.pause();
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  /**
   * Seek to specific position
   */
  const seekTo = useCallback(async (position: number) => {
    await TrackPlayer.seekTo(position);
  }, []);

  /**
   * Skip forward by seconds (default 30)
   */
  const skipForward = useCallback(
    async (seconds: number = 30) => {
      const newPosition = Math.min(
        progress.position + seconds,
        progress.duration
      );
      await seekTo(newPosition);
    },
    [progress.position, progress.duration, seekTo]
  );

  /**
   * Skip backward by seconds (default 15)
   */
  const skipBackward = useCallback(
    async (seconds: number = 15) => {
      const newPosition = Math.max(progress.position - seconds, 0);
      await seekTo(newPosition);
    },
    [progress.position, seekTo]
  );

  /**
   * Load and play a track
   */
  const loadTrack = useCallback(
    async (track: Track) => {
      setIsLoading(true);

      try {
        // Reset the queue
        await TrackPlayer.reset();

        // Add the track
        await TrackPlayer.add({
          id: track.id,
          url: track.audioUrl,
          title: track.title,
          artist: 'tsucast',
          artwork: track.artwork,
          duration: track.duration,
        });

        // Update store
        setCurrentTrack(track);

        // Set playback speed
        await TrackPlayer.setRate(playbackSpeed);

        // Start playing
        await TrackPlayer.play();
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to load track:', error);
        }
        setIsLoading(false);
        throw error;
      }
    },
    [setCurrentTrack, setIsLoading, playbackSpeed]
  );

  /**
   * Load and play from library item (with saved position)
   */
  const loadFromLibrary = useCallback(
    async (libraryItem: LibraryItem) => {
      if (!libraryItem.audio?.audio_url) {
        throw new Error('No audio URL available');
      }

      setIsLoading(true);

      try {
        // Reset the queue
        await TrackPlayer.reset();

        // Add the track
        await TrackPlayer.add({
          id: libraryItem.audio.id,
          url: libraryItem.audio.audio_url,
          title: libraryItem.audio.title || 'Untitled',
          artist: 'tsucast',
          duration: libraryItem.audio.duration_seconds || undefined,
        });

        // Store library ID for position saving
        setCurrentLibraryId(libraryItem.id);

        // Update store with track info
        setCurrentTrack({
          id: libraryItem.audio.id,
          audioUrl: libraryItem.audio.audio_url,
          title: libraryItem.audio.title || 'Untitled',
          duration: libraryItem.audio.duration_seconds || undefined,
          sourceUrl: libraryItem.audio.original_url,
        });

        // Set playback speed
        await TrackPlayer.setRate(playbackSpeed);

        // Seek to saved position if exists
        if (libraryItem.playback_position > 0) {
          await TrackPlayer.seekTo(libraryItem.playback_position);
        }

        // Start playing
        await TrackPlayer.play();
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to load from library:', error);
        }
        setIsLoading(false);
        throw error;
      }
    },
    [setCurrentTrack, setCurrentLibraryId, setIsLoading, playbackSpeed]
  );

  /**
   * Stop playback and reset
   */
  const stop = useCallback(async () => {
    await TrackPlayer.reset();
    setCurrentTrack(null);
    setCurrentLibraryId(null);
    setPosition(0);
    setDuration(0);
  }, [setCurrentTrack, setCurrentLibraryId, setPosition, setDuration]);

  /**
   * Load playlist items to queue and start playing
   * Story: 4-3 Playlist Management
   */
  const loadPlaylistToQueue = useCallback(
    async (items: PlaylistItem[]) => {
      if (items.length === 0) return;

      setIsLoading(true);

      try {
        // Reset the queue
        await TrackPlayer.reset();

        // Map playlist items to tracks
        const tracks = items
          .filter((item) => item.audio?.audio_url)
          .map((item) => ({
            id: item.audio.id,
            url: item.audio.audio_url,
            title: item.audio.title || 'Untitled',
            artist: 'tsucast',
            duration: item.audio.duration_seconds || undefined,
          }));

        if (tracks.length === 0) {
          throw new Error('No playable items in playlist');
        }

        // Add all tracks to the queue
        await TrackPlayer.add(tracks);

        // Update store with first track info
        const firstItem = items[0];
        setCurrentTrack({
          id: firstItem.audio.id,
          audioUrl: firstItem.audio.audio_url,
          title: firstItem.audio.title || 'Untitled',
          duration: firstItem.audio.duration_seconds || undefined,
          sourceUrl: firstItem.audio.original_url,
        });

        // Set playback speed
        await TrackPlayer.setRate(playbackSpeed);

        // Start playing
        await TrackPlayer.play();
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to load playlist to queue:', error);
        }
        setIsLoading(false);
        throw error;
      }
    },
    [setCurrentTrack, setIsLoading, playbackSpeed]
  );

  return {
    // State
    currentTrack,
    isPlaying,
    isLoading: isLoading || isBuffering,
    position: progress.position,
    duration: progress.duration,
    buffered: progress.buffered,

    // Actions
    play,
    pause,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    loadTrack,
    loadFromLibrary,
    loadPlaylistToQueue,
    stop,
  };
}
