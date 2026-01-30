/**
 * Free Content Section
 *
 * Displays admin-curated free content that anyone can listen to without auth.
 * Shown at the top of the library screen for all users.
 * Long-press to add items to playlists.
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFreeContent } from '@/hooks/useFreeContent';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { usePlaylists } from '@/hooks/usePlaylists';
import { AddToPlaylistMenu } from '@/components/library/AddToPlaylistMenu';
import { CreatePlaylistModal } from '@/components/library/CreatePlaylistModal';
import type { FreeContentItem } from '@/services/api';

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '';
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
}

export function FreeContentSection() {
  const { data: items, isLoading, error } = useFreeContent();
  const { loadTrack } = useAudioPlayer();
  const { createPlaylist, isCreating } = usePlaylists();
  const [selectedItem, setSelectedItem] = useState<FreeContentItem | null>(null);
  const [showAddToPlaylistMenu, setShowAddToPlaylistMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (isLoading || error || !items || items.length === 0) {
    return null;
  }

  const handleLongPress = (item: FreeContentItem) => {
    setSelectedItem(item);
    setShowAddToPlaylistMenu(true);
  };

  const handleCreatePlaylist = async (name: string) => {
    await createPlaylist(name);
    setShowCreateModal(false);
    // Re-open add menu so user can add to the new playlist
    if (selectedItem) {
      setShowAddToPlaylistMenu(true);
    }
  };

  const handlePlay = async (item: (typeof items)[0]) => {
    if (!item.audio_url) return;

    await loadTrack({
      id: item.id,
      title: item.title,
      audioUrl: item.audio_url,
      duration: item.duration_seconds ?? undefined,
      wordCount: item.word_count ?? undefined,
      sourceUrl: item.source_url ?? undefined,
    });

    router.push(`/player/${item.id}`);
  };

  return (
    <View className="py-3">
      <View className="px-4 mb-3">
        <Text className="text-base font-semibold text-amber-900 dark:text-amber-100">
          Free Samples
        </Text>
        <Text className="text-xs text-amber-600 dark:text-amber-400">
          Try tsucast — no account needed
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handlePlay(item)}
            onLongPress={() => handleLongPress(item)}
            delayLongPress={300}
            className="bg-amber-100/50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 w-48"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="headset" size={20} color="#F59E0B" />
              <TouchableOpacity
                onPress={() => handleLongPress(item)}
                className="bg-amber-500 rounded-full w-8 h-8 items-center justify-center"
                accessibilityLabel="Add to playlist"
              >
                <Ionicons name="add" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text
              className="text-sm font-medium text-amber-900 dark:text-amber-100"
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {item.duration_seconds && (
              <Text className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {formatDuration(item.duration_seconds)}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add to Playlist Menu */}
      <AddToPlaylistMenu
        audioId={selectedItem?.id || ''}
        audioUrl={selectedItem?.audio_url || undefined}
        audioTitle={selectedItem?.title || undefined}
        audioDuration={selectedItem?.duration_seconds || undefined}
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

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePlaylist}
        isCreating={isCreating}
      />
    </View>
  );
}
