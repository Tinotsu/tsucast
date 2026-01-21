/**
 * LibraryList Component
 *
 * FlashList-based performant library list.
 * Stories: 4-1 Library View, 4-3 Playlist Management
 */

import { FlashList } from '@shopify/flash-list';
import { LibraryItem } from './LibraryItem';
import type { LibraryItem as LibraryItemData } from '@/services/api';

interface LibraryListProps {
  items: LibraryItemData[];
  onDelete: (id: string) => void;
  onLongPress?: (item: LibraryItemData) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function LibraryList({
  items,
  onDelete,
  onLongPress,
  onRefresh,
  refreshing = false,
}: LibraryListProps) {
  return (
    <FlashList
      data={items}
      renderItem={({ item }) => (
        <LibraryItem
          item={item}
          onDelete={() => onDelete(item.id)}
          onLongPress={onLongPress ? () => onLongPress(item) : undefined}
        />
      )}
      keyExtractor={(item) => item.id}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
}
