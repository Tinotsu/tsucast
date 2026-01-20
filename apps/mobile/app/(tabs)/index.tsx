import { View, Text, SafeAreaView } from 'react-native';

export default function AddScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown">
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-4">
          Add Content
        </Text>
        <Text className="text-amber-700 dark:text-amber-300 text-center">
          Paste a URL to convert any article into a podcast
        </Text>
      </View>
    </SafeAreaView>
  );
}
