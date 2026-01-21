/**
 * Playlist Detail Screen
 *
 * Shows playlist items with drag-to-reorder and play all functionality.
 * Story: 4-3 Playlist Management
 */

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { usePlaylistItems, usePlaylists, PlaylistItem } from '@/hooks/usePlaylists';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/utils/format';

interface PlaylistItemRowProps {
  item: PlaylistItem;
  drag: () => void;
  isActive: boolean;
  onPlay: () => void;
  onRemove: () => void;
}

function PlaylistItemRow({ item, drag, isActive, onPlay, onRemove }: PlaylistItemRowProps) {
  return (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        onPress={onPlay}
        disabled={isActive}
        className={`flex-row items-center p-4 border-b border-amber-200 dark:border-amber-800 ${
          isActive ? 'bg-amber-100 dark:bg-amber-900' : 'bg-cream dark:bg-deep-brown'
        }`}
        activeOpacity={0.7}
      >
        {/* Drag handle */}
        <TouchableOpacity onPressIn={drag} className="p-2 mr-2">
          <Ionicons name="menu" size={20} color="#92400E" />
        </TouchableOpacity>

        {/* Content */}
        <View className="flex-1">
          <Text
            className="text-base font-medium text-amber-900 dark:text-amber-100"
            numberOfLines={2}
          >
            {item.audio?.title || 'Untitled'}
          </Text>
          <Text className="text-sm text-amber-600 dark:text-amber-400">
            {formatDuration(item.audio?.duration_seconds ?? null)}
          </Text>
        </View>

        {/* Remove button */}
        <TouchableOpacity
          onPress={onRemove}
          className="p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle-outline" size={24} color="#DC2626" />
        </TouchableOpacity>
      </TouchableOpacity>
    </ScaleDecorator>
  );
}

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Handle missing playlist ID gracefully
  if (!id) {
    return <Redirect href="/(tabs)/library" />;
  }

  const {
    playlist,
    items,
    isLoading,
    removeItem,
    reorderItems,
    isRemoving,
  } = usePlaylistItems(id);
  const { renamePlaylist, deletePlaylist } = usePlaylists();
  const { loadPlaylistToQueue } = useAudioPlayer();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const handlePlayAll = useCallback(() => {
    if (items.length > 0) {
      loadPlaylistToQueue(items);
    }
  }, [items, loadPlaylistToQueue]);

  const handleDragEnd = useCallback(
    ({ data }: { data: PlaylistItem[] }) => {
      reorderItems(data.map((item) => item.id));
    },
    [reorderItems]
  );

  const handleRemoveItem = useCallback(
    (itemId: string, title: string) => {
      Alert.alert(
        'Remove from Playlist',
        `Remove "${title}" from this playlist?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeItem(itemId),
          },
        ]
      );
    },
    [removeItem]
  );

  const handlePlayItem = useCallback(
    (item: PlaylistItem) => {
      // Navigate to player with this item
      if (item.audio?.id) {
        router.push(`/player/${item.audio.id}`);
      }
    },
    []
  );

  const handleStartRename = useCallback(() => {
    setEditName(playlist?.name || '');
    setIsEditing(true);
  }, [playlist?.name]);

  const handleSaveRename = useCallback(async () => {
    if (editName.trim() && editName.trim() !== playlist?.name) {
      await renamePlaylist({ id: id, name: editName.trim() });
    }
    setIsEditing(false);
  }, [editName, playlist?.name, renamePlaylist, id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Playlist',
      `Delete "${playlist?.name}"? Items will remain in your library.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(id);
            router.back();
          },
        },
      ]
    );
  }, [playlist?.name, deletePlaylist, id]);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<PlaylistItem>) => (
      <PlaylistItemRow
        item={item}
        drag={drag}
        isActive={isActive}
        onPlay={() => handlePlayItem(item)}
        onRemove={() => handleRemoveItem(item.id, item.audio?.title || 'Untitled')}
      />
    ),
    [handlePlayItem, handleRemoveItem]
  );

  const totalDuration = items.reduce(
    (acc, item) => acc + (item.audio?.duration_seconds || 0),
    0
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown" edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-amber-200 dark:border-amber-800">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#92400E" />
          </TouchableOpacity>

          <View className="flex-row">
            <TouchableOpacity onPress={handleStartRename} className="p-2 mr-2">
              <Ionicons name="pencil" size={20} color="#92400E" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} className="p-2">
              <Ionicons name="trash" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Playlist info */}
        <View className="p-4">
          {isEditing ? (
            <View className="flex-row items-center">
              <TextInput
                value={editName}
                onChangeText={setEditName}
                className="flex-1 text-xl font-bold text-amber-900 dark:text-amber-100 border-b border-amber-500 pb-1"
                autoFocus
                onBlur={handleSaveRename}
                onSubmitEditing={handleSaveRename}
                returnKeyType="done"
              />
            </View>
          ) : (
            <Text className="text-xl font-bold text-amber-900 dark:text-amber-100">
              {playlist?.name || 'Loading...'}
            </Text>
          )}
          <Text className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} •{' '}
            {formatDuration(totalDuration)}
          </Text>
        </View>

        {/* Play all button */}
        {items.length > 0 && (
          <View className="px-4 pb-4">
            <TouchableOpacity
              onPress={handlePlayAll}
              className="bg-amber-500 px-6 py-3 rounded-full flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Play All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Items list */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-amber-600 dark:text-amber-400">Loading...</Text>
          </View>
        ) : items.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <Ionicons name="list-outline" size={64} color="#A8A29E" />
            <Text className="text-lg font-medium text-amber-900 dark:text-amber-100 mt-4">
              Playlist is empty
            </Text>
            <Text className="text-amber-600 dark:text-amber-400 text-center mt-2">
              Long-press items in your library to add them to this playlist
            </Text>
          </View>
        ) : (
          <DraggableFlatList
            data={items}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            containerStyle={{ flex: 1 }}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
