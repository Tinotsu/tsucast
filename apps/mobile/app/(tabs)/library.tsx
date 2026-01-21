/**
 * Library Screen
 *
 * Displays user's saved podcasts with playback progress and playlists.
 * Stories: 4-1 Library View, 4-3 Playlist Management, 5-2 Limit Display & Upgrade Prompt
 */

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLibrary } from '@/hooks/useLibrary';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useSubscription } from '@/hooks/useSubscription';
import { LibraryList, LibrarySkeleton } from '@/components/library';
import { PlaylistCard } from '@/components/library/PlaylistCard';
import { CreatePlaylistModal } from '@/components/library/CreatePlaylistModal';
import { AddToPlaylistMenu } from '@/components/library/AddToPlaylistMenu';
import { UpgradeBanner } from '@/components/ui/UpgradeBanner';
import type { LibraryItem as LibraryItemData } from '@/services/api';

export default function LibraryScreen() {
  const { items, isLoading, error, refetch, deleteItem } = useLibrary();
  const {
    playlists,
    isLoading: isLoadingPlaylists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    isCreating,
  } = usePlaylists();
  const { isPro } = useSubscription();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddToPlaylistMenu, setShowAddToPlaylistMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LibraryItemData | null>(null);

  // Show upgrade banner for free users who have items in their library (engaged users)
  const showUpgradeBanner = !isPro && items.length >= 2;

  const handleCreatePlaylist = useCallback(async (name: string) => {
    try {
      await createPlaylist(name);
      setShowCreateModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create playlist');
    }
  }, [createPlaylist]);

  const handlePlaylistPress = useCallback((playlistId: string) => {
    router.push(`/playlist/${playlistId}`);
  }, []);

  const handlePlaylistLongPress = useCallback((playlist: { id: string; name: string }) => {
    Alert.alert(
      playlist.name,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: () => {
            Alert.prompt(
              'Rename Playlist',
              'Enter new name:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Rename',
                  onPress: (newName: string | undefined) => {
                    if (newName?.trim()) {
                      renamePlaylist({ id: playlist.id, name: newName.trim() });
                    }
                  },
                },
              ],
              'plain-text',
              playlist.name
            );
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Playlist',
              `Delete "${playlist.name}"? Items will remain in your library.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deletePlaylist(playlist.id),
                },
              ]
            );
          },
        },
      ]
    );
  }, [renamePlaylist, deletePlaylist]);

  const handleItemLongPress = useCallback((item: LibraryItemData) => {
    if (item.audio?.id) {
      setSelectedItem(item);
      setShowAddToPlaylistMenu(true);
    }
  }, []);

  if (isLoading) {
    return <LibrarySkeleton />;
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown" edges={['top']}>
        <View className="flex-1 items-center justify-center p-8">
          <Ionicons name="alert-circle-outline" size={64} color="#D97706" />
          <Text className="mt-4 text-lg text-amber-900 dark:text-amber-100 text-center">
            Failed to load library
          </Text>
          <Text className="mt-2 text-amber-700 dark:text-amber-300 text-center">
            {error.message}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-6 bg-amber-500 px-6 py-3 rounded-full"
            activeOpacity={0.7}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown" edges={['top']}>
        <View className="flex-1 items-center justify-center p-8">
          <Ionicons name="library-outline" size={64} color="#D97706" />
          <Text className="mt-4 text-lg text-amber-900 dark:text-amber-100">
            Your library is empty
          </Text>
          <Text className="mt-2 text-amber-700 dark:text-amber-300 text-center">
            Paste a URL on the Add tab to generate your first podcast
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown" edges={['top']}>
      <View className="px-4 py-3 border-b border-amber-200 dark:border-amber-800">
        <Text className="text-xl font-bold text-amber-900 dark:text-amber-100">
          Your Library
        </Text>
        <Text className="text-sm text-amber-600 dark:text-amber-400">
          {items.length} {items.length === 1 ? 'podcast' : 'podcasts'}
        </Text>
      </View>

      {/* Playlists section */}
      <View className="py-3">
        <View className="flex-row items-center justify-between px-4 mb-3">
          <Text className="text-base font-semibold text-amber-900 dark:text-amber-100">
            Playlists
          </Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="flex-row items-center"
          >
            <Ionicons name="add-circle" size={20} color="#F59E0B" />
            <Text className="text-amber-500 ml-1 font-medium">New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {playlists.length === 0 && !isLoadingPlaylists ? (
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="p-4 bg-amber-100/50 dark:bg-amber-900/30 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 w-40 h-36 items-center justify-center"
            >
              <Ionicons name="add" size={32} color="#F59E0B" />
              <Text className="text-amber-600 dark:text-amber-400 mt-2 text-center">
                Create your first playlist
              </Text>
            </TouchableOpacity>
          ) : (
            playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onPress={() => handlePlaylistPress(playlist.id)}
                onLongPress={() => handlePlaylistLongPress(playlist)}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Upgrade banner for engaged free users */}
      {showUpgradeBanner && (
        <View className="px-4 pb-3">
          <UpgradeBanner message="Loving your podcasts?" />
        </View>
      )}

      {/* All items section */}
      <View className="flex-1">
        <View className="px-4 py-2 border-t border-amber-200 dark:border-amber-800">
          <Text className="text-base font-semibold text-amber-900 dark:text-amber-100">
            All Items
          </Text>
          <Text className="text-xs text-amber-600 dark:text-amber-400">
            Long-press to add to playlist
          </Text>
        </View>
        <LibraryList
          items={items}
          onDelete={deleteItem}
          onLongPress={handleItemLongPress}
          onRefresh={refetch}
        />
      </View>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePlaylist}
        isCreating={isCreating}
      />

      {/* Add to Playlist/Queue Menu */}
      <AddToPlaylistMenu
        audioId={selectedItem?.audio?.id || ''}
        audioUrl={selectedItem?.audio?.audio_url || undefined}
        audioTitle={selectedItem?.audio?.title || undefined}
        audioDuration={selectedItem?.audio?.duration_seconds || undefined}
        visible={showAddToPlaylistMenu}
        onClose={() => {
          setShowAddToPlaylistMenu(false);
          setSelectedItem(null);
        }}
        onCreateNew={() => {
          setShowAddToPlaylistMenu(false);
          setShowCreateModal(true);
        }}
      />
    </SafeAreaView>
  );
}
