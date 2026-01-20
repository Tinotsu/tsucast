import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function UpgradeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown">
      <ScrollView className="flex-1 p-6">
        <Text className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2 text-center">
          Upgrade to Pro
        </Text>
        <Text className="text-amber-600 dark:text-amber-400 text-center mb-8">
          Unlimited articles, priority processing
        </Text>

        <View className="bg-amber-100 dark:bg-amber-900 rounded-2xl p-6 mb-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-amber-900 dark:text-amber-100">
              Pro Plan
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                $9.99
              </Text>
              <Text className="text-amber-700 dark:text-amber-300">/month</Text>
            </View>
          </View>

          <View className="space-y-3">
            {[
              'Unlimited articles per day',
              'Priority processing',
              'Early access to new features',
              'Support development',
            ].map((benefit, index) => (
              <View key={index} className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
                <Text className="ml-2 text-amber-900 dark:text-amber-100">
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity className="bg-amber-500 p-4 rounded-xl mb-4">
          <Text className="text-white font-bold text-center text-lg">
            Subscribe for $9.99/month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="p-4" onPress={() => router.back()}>
          <Text className="text-amber-600 dark:text-amber-400 text-center">
            Maybe later
          </Text>
        </TouchableOpacity>

        <Text className="mt-6 text-xs text-amber-500 text-center">
          Payment will be charged to your Apple ID account. Subscription
          automatically renews unless cancelled at least 24 hours before the
          end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
