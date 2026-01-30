/**
 * EditItemModal Component
 *
 * Modal for editing library item title and cover (emoji or image URL).
 * Story: Cover Images feature
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CoverImage } from '@/components/ui/CoverImage';

// Preset emoji grid for quick selection
const PRESET_EMOJI = [
  '📚', '🎧', '🎙️', '📰', '💡', '🌍',
  '💼', '🏠', '❤️', '⭐', '🔥', '📝',
];

interface EditItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updates: { title?: string; cover?: string | null }) => Promise<void>;
  initialTitle: string;
  initialCover: string | null;
}

type CoverTab = 'emoji' | 'url';

export function EditItemModal({
  visible,
  onClose,
  onSave,
  initialTitle,
  initialCover,
}: EditItemModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [coverTab, setCoverTab] = useState<CoverTab>('emoji');
  const [coverUrl, setCoverUrl] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
      setUrlError(null);
      setIsSaving(false);
      setError(null);

      // Determine initial cover type
      if (initialCover?.startsWith('http://') || initialCover?.startsWith('https://')) {
        setCoverTab('url');
        setCoverUrl(initialCover);
        setSelectedEmoji(null);
      } else if (initialCover) {
        setCoverTab('emoji');
        setSelectedEmoji(initialCover);
        setCoverUrl('');
      } else {
        setCoverTab('emoji');
        setSelectedEmoji(null);
        setCoverUrl('');
      }
    }
  }, [visible, initialTitle, initialCover]);

  const validateUrl = useCallback((url: string): boolean => {
    if (!url.trim()) {
      setUrlError(null);
      return true;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setUrlError('URL must start with http:// or https://');
      return false;
    }
    try {
      new URL(url);
      setUrlError(null);
      return true;
    } catch {
      setUrlError('Invalid URL format');
      return false;
    }
  }, []);

  const handleUrlBlur = () => {
    validateUrl(coverUrl);
  };

  const getCurrentCover = (): string | null => {
    if (coverTab === 'emoji') {
      return selectedEmoji;
    }
    return coverUrl.trim() || null;
  };

  const handleSave = async () => {
    if (isSaving) return;

    // Validate title
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    // Validate URL if on URL tab
    if (coverTab === 'url' && coverUrl.trim() && !validateUrl(coverUrl)) {
      return;
    }

    setIsSaving(true);
    setError(null); // Clear any previous error
    try {
      const updates: { title?: string; cover?: string | null } = {};

      if (trimmedTitle !== initialTitle) {
        updates.title = trimmedTitle;
      }

      const newCover = getCurrentCover();
      if (newCover !== initialCover) {
        updates.cover = newCover;
      }

      // Only save if something changed
      if (Object.keys(updates).length > 0) {
        await onSave(updates);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save:', err);
      // Show error to user and keep modal open so they can retry
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleClearCover = () => {
    setSelectedEmoji(null);
    setCoverUrl('');
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
              Edit Item
            </Text>

            {/* Error Banner */}
            {error && (
              <View className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
                <Text className="text-red-700 dark:text-red-300 text-sm text-center">
                  {error}
                </Text>
              </View>
            )}

            {/* Title Input */}
            <Text className="text-sm text-amber-700 dark:text-amber-300 mb-1">
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title"
              placeholderTextColor="#A8A29E"
              className="border border-amber-300 dark:border-amber-700 rounded-lg p-3 mb-4 text-amber-900 dark:text-amber-100 bg-white dark:bg-amber-900/30"
              maxLength={500}
              autoFocus
            />

            {/* Cover Preview */}
            <Text className="text-sm text-amber-700 dark:text-amber-300 mb-2">
              Cover
            </Text>
            <View className="items-center mb-4">
              <CoverImage cover={getCurrentCover()} size={80} />
              {getCurrentCover() && (
                <TouchableOpacity
                  onPress={handleClearCover}
                  className="mt-2"
                >
                  <Text className="text-sm text-amber-600 dark:text-amber-400 underline">
                    Clear cover
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Cover Tabs */}
            <View className="flex-row mb-3">
              <TouchableOpacity
                onPress={() => setCoverTab('emoji')}
                className={`flex-1 py-2 rounded-l-lg ${
                  coverTab === 'emoji'
                    ? 'bg-amber-500'
                    : 'bg-amber-200 dark:bg-amber-800'
                }`}
              >
                <Text className={`text-center font-medium ${
                  coverTab === 'emoji'
                    ? 'text-white'
                    : 'text-amber-700 dark:text-amber-300'
                }`}>
                  Emoji
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCoverTab('url')}
                className={`flex-1 py-2 rounded-r-lg ${
                  coverTab === 'url'
                    ? 'bg-amber-500'
                    : 'bg-amber-200 dark:bg-amber-800'
                }`}
              >
                <Text className={`text-center font-medium ${
                  coverTab === 'url'
                    ? 'text-white'
                    : 'text-amber-700 dark:text-amber-300'
                }`}>
                  Image URL
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {coverTab === 'emoji' ? (
              <ScrollView className="max-h-32 mb-4">
                <View className="flex-row flex-wrap justify-center gap-2">
                  {PRESET_EMOJI.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => handleEmojiSelect(emoji)}
                      className={`w-12 h-12 items-center justify-center rounded-lg ${
                        selectedEmoji === emoji
                          ? 'bg-amber-500'
                          : 'bg-amber-100 dark:bg-amber-800'
                      }`}
                    >
                      <Text style={{ fontSize: 24 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View className="mb-4">
                <TextInput
                  value={coverUrl}
                  onChangeText={(text) => {
                    setCoverUrl(text);
                    if (urlError) setUrlError(null);
                  }}
                  onBlur={handleUrlBlur}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor="#A8A29E"
                  className="border border-amber-300 dark:border-amber-700 rounded-lg p-3 text-amber-900 dark:text-amber-100 bg-white dark:bg-amber-900/30"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {urlError && (
                  <Text className="text-red-500 text-sm mt-1">{urlError}</Text>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleClose}
                className="flex-1 p-3 rounded-lg bg-gray-200 dark:bg-gray-700"
                disabled={isSaving}
              >
                <Text className="text-center text-gray-700 dark:text-gray-300 font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className={`flex-1 p-3 rounded-lg flex-row items-center justify-center ${
                  title.trim() && !isSaving
                    ? 'bg-amber-500'
                    : 'bg-amber-300 dark:bg-amber-700'
                }`}
                disabled={!title.trim() || isSaving}
              >
                {isSaving && (
                  <ActivityIndicator size="small" color="white" className="mr-2" />
                )}
                <Text className="text-center text-white font-medium">
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
