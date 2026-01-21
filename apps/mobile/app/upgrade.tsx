/**
 * Upgrade Screen
 *
 * Displays subscription options and handles purchases.
 * Story: 5-3 In-App Purchase Integration
 */

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isPro,
  isPurchasesConfigured,
  type PurchasesOfferings,
} from '@/services/purchases';

const BENEFITS = [
  'Unlimited articles per day',
  'Priority processing',
  'Early access to new features',
  'Support development',
];

export default function UpgradeScreen() {
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setIsLoading(true);
    const data = await getOfferings();
    setOfferings(data);
    setIsLoading(false);
  };

  const handlePurchase = async () => {
    const pkg = offerings?.current?.availablePackages[0];
    if (!pkg) {
      Alert.alert('Error', 'No subscription package available');
      return;
    }

    if (!isPurchasesConfigured()) {
      Alert.alert(
        'Coming Soon',
        'In-app purchases will be available when the app is released on the App Store.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsPurchasing(true);
    try {
      const { customerInfo, cancelled } = await purchasePackage(pkg);
      if (cancelled) {
        // User cancelled - no action needed
        return;
      }
      if (customerInfo && isPro(customerInfo)) {
        Alert.alert(
          'Welcome to Pro!',
          'Enjoy unlimited articles.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Purchase error:', error);
      }
      Alert.alert(
        'Purchase Failed',
        'Something went wrong. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!isPurchasesConfigured()) {
      Alert.alert(
        'Coming Soon',
        'Restore purchases will be available when the app is released on the App Store.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo && isPro(customerInfo)) {
        Alert.alert(
          'Subscription Restored!',
          'Your Pro subscription has been restored.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          'No Subscription Found',
          'We couldn\'t find an active subscription for this account.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Restore error:', error);
      }
      Alert.alert(
        'Restore Failed',
        'Something went wrong. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const pkg = offerings?.current?.availablePackages[0];
  const price = pkg?.product.priceString || '$9.99';

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown" edges={['top']}>
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-amber-100 dark:bg-amber-900/50 rounded-full items-center justify-center mb-4">
            <Ionicons name="star" size={40} color="#F59E0B" />
          </View>
          <Text className="text-3xl font-bold text-amber-900 dark:text-amber-100 text-center">
            Upgrade to Pro
          </Text>
          <Text className="mt-2 text-amber-600 dark:text-amber-400 text-center">
            Unlimited articles, priority processing
          </Text>
        </View>

        {/* Plan Card */}
        <View className="bg-amber-100 dark:bg-amber-900/50 rounded-2xl p-6 mb-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-amber-900 dark:text-amber-100">
              Pro Plan
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                {price}
              </Text>
              <Text className="text-amber-700 dark:text-amber-300">/month</Text>
            </View>
          </View>

          {/* Benefits */}
          <View className="gap-3">
            {BENEFITS.map((benefit, index) => (
              <View key={index} className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                <Text className="ml-3 text-amber-900 dark:text-amber-100 text-base">
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={isLoading || isPurchasing}
          className={`py-4 rounded-xl ${isPurchasing || isLoading ? 'bg-amber-400' : 'bg-amber-500'}`}
          activeOpacity={0.8}
        >
          {isPurchasing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-center text-lg">
              Subscribe for {price}/month
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={isRestoring}
          className="mt-4 py-3"
          activeOpacity={0.7}
        >
          {isRestoring ? (
            <ActivityIndicator color="#D97706" size="small" />
          ) : (
            <Text className="text-amber-600 dark:text-amber-400 text-center">
              Restore Purchase
            </Text>
          )}
        </TouchableOpacity>

        {/* Maybe Later */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="py-3"
          activeOpacity={0.7}
        >
          <Text className="text-zinc-500 dark:text-zinc-400 text-center">
            Maybe later
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text className="mt-6 text-xs text-amber-500 text-center px-4">
          Payment will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account.
          Subscription automatically renews unless cancelled at least 24 hours before
          the end of the current period. You can manage and cancel your subscription
          in your {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
