/**
 * AddToPlaylistMenu Component
 *
 * Bottom sheet menu for adding an item to a playlist or queue.
 * Stories: 4-3 Playlist Management, 4-4 Queue Management
 */

import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useQueue } from '@/hooks/useQueue';
import { useState } from 'react';

interface AddToPlaylistMenuProps {
  audioId: string;
  audioUrl?: string;
  audioTitle?: string;
  audioDuration?: number;
  visible: boolean;
  onClose: () => void;
  onCreateNew?: () => void;
}

export function AddToPlaylistMenu({
  audioId,
  audioUrl,
  audioTitle,
  audioDuration,
  visible,
  onClose,
  onCreateNew,
}: AddToPlaylistMenuProps) {
  const { playlists, isLoading } = usePlaylists();
  const { addToQueue } = useQueue();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addingToQueue, setAddingToQueue] = useState(false);

  const handleAddToQueue = async () => {
    if (!audioUrl) {
      Toast.show({
        type: 'error',
        text1: 'Cannot Add to Queue',
        text2: 'Audio is not available',
        visibilityTime: 2000,
      });
      return;
    }

    setAddingToQueue(true);
    try {
      const success = await addToQueue({
        id: audioId,
        url: audioUrl,
        title: audioTitle || 'Untitled',
        duration: audioDuration,
      });

      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Added to Queue',
          text2: audioTitle || 'Untitled',
          visibilityTime: 2000,
        });
      }
      onClose();
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to add to queue:', error);
      }
      Toast.show({
        type: 'error',
        text1: 'Failed to Add',
        text2: 'Could not add to queue',
        visibilityTime: 2000,
      });
    } finally {
      setAddingToQueue(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    setAddingTo(playlistId);
    try {
      // Import dynamically to avoid circular dependencies
      const { addToPlaylist } = await import('@/services/api');
      await addToPlaylist(playlistId, audioId);
      Toast.show({
        type: 'success',
        text1: 'Added to Playlist',
        text2: audioTitle || 'Untitled',
        visibilityTime: 2000,
      });
      onClose();
    } catch (error) {
      // Error adding to playlist
      if (__DEV__) {
        console.error('Failed to add to playlist:', error);
      }
      Toast.show({
        type: 'error',
        text1: 'Failed to Add',
        text2: 'Could not add to playlist',
        visibilityTime: 2000,
      });
    } finally {
      setAddingTo(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/50 justify-end"
      >
        <TouchableOpacity
          activeOpacity={1}
          className="bg-cream dark:bg-deep-brown rounded-t-2xl max-h-[70%]"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-amber-200 dark:border-amber-800">
            <Text className="text-lg font-bold text-amber-900 dark:text-amber-100">
              Add to...
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#92400E" />
            </TouchableOpacity>
          </View>

          {/* Add to Queue option */}
          {audioUrl && (
            <TouchableOpacity
              onPress={handleAddToQueue}
              disabled={addingToQueue}
              className="flex-row items-center p-4 border-b border-amber-200 dark:border-amber-800"
            >
              <View className="w-12 h-12 bg-green-500 rounded-lg items-center justify-center mr-3">
                <Ionicons name="play-forward" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-amber-900 dark:text-amber-100">
                  Add to Queue
                </Text>
                <Text className="text-sm text-amber-600 dark:text-amber-400">
                  Play next in your listening session
                </Text>
              </View>
              {addingToQueue && <ActivityIndicator size="small" color="#F59E0B" />}
            </TouchableOpacity>
          )}

          {/* Create new playlist option */}
          {onCreateNew && (
            <TouchableOpacity
              onPress={() => {
                onClose();
                onCreateNew();
              }}
              className="flex-row items-center p-4 border-b border-amber-200 dark:border-amber-800"
            >
              <View className="w-12 h-12 bg-amber-500 rounded-lg items-center justify-center mr-3">
                <Ionicons name="add" size={24} color="white" />
              </View>
              <Text className="text-base font-medium text-amber-900 dark:text-amber-100">
                Create New Playlist
              </Text>
            </TouchableOpacity>
          )}

          {/* Playlists list */}
          <ScrollView className="max-h-80">
            {isLoading ? (
              <View className="p-8 items-center">
                <ActivityIndicator color="#F59E0B" />
              </View>
            ) : playlists.length === 0 ? (
              <View className="p-8 items-center">
                <Ionicons name="list-outline" size={48} color="#A8A29E" />
                <Text className="text-gray-500 mt-2">No playlists yet</Text>
              </View>
            ) : (
              playlists.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  onPress={() => handleAddToPlaylist(playlist.id)}
                  disabled={addingTo !== null}
                  className="flex-row items-center p-4 border-b border-amber-100 dark:border-amber-800/50"
                >
                  <View className="w-12 h-12 bg-amber-200 dark:bg-amber-800 rounded-lg items-center justify-center mr-3">
                    <Ionicons name="list" size={24} color="#F59E0B" />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base font-medium text-amber-900 dark:text-amber-100"
                      numberOfLines={1}
                    >
                      {playlist.name}
                    </Text>
                    <Text className="text-sm text-amber-600 dark:text-amber-400">
                      {playlist.itemCount} {playlist.itemCount === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                  {addingTo === playlist.id && (
                    <ActivityIndicator size="small" color="#F59E0B" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Bottom safe area padding */}
          <View className="h-8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
