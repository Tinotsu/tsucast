/**
 * CreatePlaylistModal Component
 *
 * Modal for creating a new playlist.
 * Story: 4-3 Playlist Management
 */

import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  isCreating?: boolean;
}

export function CreatePlaylistModal({
  visible,
  onClose,
  onCreate,
  isCreating = false,
}: CreatePlaylistModalProps) {
  const [name, setName] = useState('');

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (trimmedName && !isCreating) {
      onCreate(trimmedName);
      setName('');
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleClose}
          className="flex-1 bg-black/50 items-center justify-center p-4"
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-cream dark:bg-deep-brown rounded-xl p-6 w-full max-w-sm"
          >
            <Text className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-4">
              New Playlist
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Playlist name"
              placeholderTextColor="#A8A29E"
              className="border border-amber-300 dark:border-amber-700 rounded-lg p-3 mb-4 text-amber-900 dark:text-amber-100 bg-white dark:bg-amber-900/30"
              autoFocus
              maxLength={100}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleClose}
                className="flex-1 p-3 rounded-lg bg-gray-200 dark:bg-gray-700"
                disabled={isCreating}
              >
                <Text className="text-center text-gray-700 dark:text-gray-300 font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                className={`flex-1 p-3 rounded-lg ${
                  name.trim() && !isCreating
                    ? 'bg-amber-500'
                    : 'bg-amber-300 dark:bg-amber-700'
                }`}
                disabled={!name.trim() || isCreating}
              >
                <Text className="text-center text-white font-medium">
                  {isCreating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
