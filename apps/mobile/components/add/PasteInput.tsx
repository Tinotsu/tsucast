import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { isPdfUrl } from '../../utils/validation';

interface PasteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  isLoading?: boolean;
  isValid?: boolean;
  isCached?: boolean;
}

export function PasteInput({
  value,
  onChangeText,
  error,
  isLoading = false,
  isValid = false,
  isCached = false,
}: PasteInputProps) {
  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        onChangeText(text);
      }
    } catch (err) {
      if (__DEV__) console.error('Failed to paste:', err);
    }
  };

  // Clear input
  const handleClear = () => {
    onChangeText('');
  };

  const hasError = !!error;
  const showSuccess = isValid && !hasError && value.length > 0;
  const isPdf = isPdfUrl(value);

  return (
    <View>
      <View
        className={`min-h-[200px] bg-zinc-900 border rounded-2xl p-4 ${
          hasError
            ? 'border-red-500'
            : showSuccess
            ? 'border-green-500/50'
            : 'border-zinc-800'
        }`}
      >
        <TextInput
          placeholder="Paste article URL here..."
          placeholderTextColor="#71717a"
          value={value}
          onChangeText={onChangeText}
          className="flex-1 text-white text-lg"
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!isLoading}
        />

        {/* Input Actions */}
        <View className="flex-row justify-end gap-2 mt-2">
          {value.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              disabled={isLoading}
              className="p-2 rounded-full bg-zinc-800"
            >
              <Ionicons name="close" size={20} color="#a1a1aa" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handlePaste}
            disabled={isLoading}
            className="flex-row items-center px-4 py-2 rounded-full bg-zinc-800"
          >
            <Ionicons name="clipboard-outline" size={18} color="#a1a1aa" />
            <Text className="text-zinc-400 ml-2 font-medium">Paste</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Message */}
      {hasError && (
        <Text className="text-red-400 mt-2 ml-1">{error}</Text>
      )}

      {/* Success/Cached Status */}
      {isCached && !hasError && (
        <View className="flex-row items-center mt-3 ml-1">
          <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
          <Text className="text-green-500 ml-2">Ready to play instantly</Text>
        </View>
      )}

      {showSuccess && !isCached && (
        <View className="flex-row items-center mt-3 ml-1">
          <Ionicons name="checkmark-circle-outline" size={18} color="#22c55e" />
          <Text className="text-green-500 ml-2">Valid URL</Text>
          {isPdf && (
            <View className="ml-2 px-2 py-0.5 bg-zinc-800 rounded">
              <Text className="text-zinc-400 text-xs font-medium">PDF</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
