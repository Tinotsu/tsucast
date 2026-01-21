/**
 * Queue Hook
 *
 * Manages playback queue via react-native-track-player.
 * Story: 4-4 Queue Management
 */

import { useState, useEffect, useCallback } from 'react';
import TrackPlayer, {
  Event,
  useActiveTrack,
  Track,
} from 'react-native-track-player';

export interface QueueTrack {
  id: string;
  url: string;
  title: string;
  artist?: string;
  artwork?: string;
  duration?: number;
}

export function useQueue() {
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const activeTrack = useActiveTrack();

  // Fetch queue from track player
  const fetchQueue = useCallback(async () => {
    try {
      const tracks = await TrackPlayer.getQueue();
      const activeIndex = await TrackPlayer.getActiveTrackIndex();

      // Only show tracks AFTER current one
      if (activeIndex !== undefined && activeIndex >= 0) {
        setQueue(tracks.slice(activeIndex + 1) as QueueTrack[]);
      } else {
        setQueue(tracks as QueueTrack[]);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch queue:', error);
      }
      setQueue([]);
    }
  }, []);

  // Sync queue state with track-player
  useEffect(() => {
    fetchQueue();

    // Re-fetch when track changes
    const subscription = TrackPlayer.addEventListener(
      Event.PlaybackActiveTrackChanged,
      fetchQueue
    );

    return () => subscription.remove();
  }, [activeTrack, fetchQueue]);

  /**
   * Add a track to the end of the queue
   */
  const addToQueue = useCallback(
    async (track: QueueTrack) => {
      try {
        await TrackPlayer.add({
          id: track.id,
          url: track.url,
          title: track.title,
          artist: track.artist || 'tsucast',
          artwork: track.artwork,
          duration: track.duration,
        });

        // Refresh queue state
        await fetchQueue();
        return true;
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to add to queue:', error);
        }
        return false;
      }
    },
    [fetchQueue]
  );

  /**
   * Remove a track from the queue
   */
  const removeFromQueue = useCallback(
    async (trackId: string) => {
      try {
        const tracks = await TrackPlayer.getQueue();
        const index = tracks.findIndex((t) => t.id === trackId);

        if (index !== -1) {
          await TrackPlayer.remove(index);
        }

        // Refresh queue state
        await fetchQueue();
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to remove from queue:', error);
        }
      }
    },
    [fetchQueue]
  );

  /**
   * Reorder the queue (upcoming tracks only)
   */
  const reorderQueue = useCallback(
    async (newOrder: QueueTrack[]) => {
      try {
        // Remove all upcoming tracks
        await TrackPlayer.removeUpcomingTracks();

        // Add them back in new order
        if (newOrder.length > 0) {
          await TrackPlayer.add(
            newOrder.map((track) => ({
              id: track.id,
              url: track.url,
              title: track.title,
              artist: track.artist || 'tsucast',
              artwork: track.artwork,
              duration: track.duration,
            }))
          );
        }

        setQueue(newOrder);
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to reorder queue:', error);
        }
      }
    },
    []
  );

  /**
   * Clear all upcoming tracks from the queue
   */
  const clearQueue = useCallback(async () => {
    try {
      await TrackPlayer.removeUpcomingTracks();
      setQueue([]);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to clear queue:', error);
      }
    }
  }, []);

  /**
   * Skip to a specific track in the queue
   */
  const skipToTrack = useCallback(async (trackId: string) => {
    try {
      const tracks = await TrackPlayer.getQueue();
      const index = tracks.findIndex((t) => t.id === trackId);

      if (index !== -1) {
        await TrackPlayer.skip(index);
        await TrackPlayer.play();
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to skip to track:', error);
      }
    }
  }, []);

  return {
    queue,
    queueLength: queue.length,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    skipToTrack,
    refreshQueue: fetchQueue,
  };
}
