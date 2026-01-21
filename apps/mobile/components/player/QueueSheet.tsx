/**
 * QueueSheet Component
 *
 * Bottom sheet displaying playback queue with drag-to-reorder.
 * Story: 4-4 Queue Management
 */

import { useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useQueue, QueueTrack } from '@/hooks/useQueue';
import { QueueItem } from './QueueItem';

interface QueueSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function QueueSheet({ visible, onClose }: QueueSheetProps) {
  const { queue, reorderQueue, removeFromQueue, clearQueue, skipToTrack } = useQueue();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const snapPoints = useMemo(() => ['50%', '90%'], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: QueueTrack[] }) => {
      reorderQueue(data);
    },
    [reorderQueue]
  );

  const handleRemove = useCallback(
    (trackId: string) => {
      removeFromQueue(trackId);
    },
    [removeFromQueue]
  );

  const handlePlay = useCallback(
    (trackId: string) => {
      skipToTrack(trackId);
      onClose();
    },
    [skipToTrack, onClose]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<QueueTrack>) => (
      <QueueItem
        item={item}
        drag={drag}
        isDragging={isActive}
        onRemove={() => handleRemove(item.id)}
        onPlay={() => handlePlay(item.id)}
      />
    ),
    [handleRemove, handlePlay]
  );

  if (!visible) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: isDark ? '#1C1917' : '#FFFBEB' }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#F59E0B' : '#D97706' }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pb-3 border-b border-amber-200">
            <Text className="text-lg font-bold text-amber-900">Up Next</Text>
            <View className="flex-row items-center">
              {queue.length > 0 && (
                <TouchableOpacity
                  onPress={clearQueue}
                  className="mr-4 px-3 py-1 bg-red-100 rounded-full"
                >
                  <Text className="text-red-600 text-sm font-medium">Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#92400E" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Queue content */}
          {queue.length === 0 ? (
            <View className="flex-1 items-center justify-center p-8">
              <Ionicons name="musical-notes-outline" size={48} color="#D97706" />
              <Text className="mt-4 text-amber-900 font-medium">Queue is empty</Text>
              <Text className="text-sm text-amber-600 text-center mt-2">
                Long-press items in your library to add them to the queue
              </Text>
            </View>
          ) : (
            <View className="flex-1 px-4 pt-3">
              <Text className="text-xs text-amber-600 mb-2">
                {queue.length} {queue.length === 1 ? 'item' : 'items'} in queue • Drag to
                reorder
              </Text>
              <DraggableFlatList
                data={queue}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                containerStyle={{ flex: 1 }}
              />
            </View>
          )}
        </GestureHandlerRootView>
      </BottomSheetView>
    </BottomSheet>
  );
}
