import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  loading?: boolean;
}

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  destructive = false,
  loading = false,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-3"
      activeOpacity={0.7}
    >
      <View className={`w-10 h-10 rounded-full items-center justify-center border ${
        destructive ? 'border-red-500/50' : 'border-zinc-700'
      }`}>
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? '#ef4444' : '#ffffff'}
        />
      </View>
      <View className="flex-1 ml-3">
        <Text className={`font-medium ${destructive ? 'text-red-400' : 'text-white'}`}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-zinc-500 mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={20} color="#71717a" />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, profile, signOut, isPro, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
              // Navigation handled by auth state change in root layout
            } catch (err) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleUpgrade = () => {
    router.push('/upgrade');
  };

  const handleManageSubscription = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://tsucast.com/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://tsucast.com/terms');
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@tsucast.com');
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 px-6 pt-4">
        {/* Header */}
        <Text className="text-2xl font-bold text-white mb-6">
          Settings
        </Text>

        {/* Account Section */}
        <Text className="text-sm font-semibold text-zinc-500 mb-3 uppercase tracking-wide">
          Account
        </Text>

        <View className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-3">
          <View className="flex-row items-center">
            <View className="w-12 h-12 border border-zinc-700 rounded-full items-center justify-center">
              <Ionicons name="person" size={24} color="#ffffff" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-medium text-white">
                {user?.email || 'Not signed in'}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className={`px-2 py-0.5 rounded-full border ${
                  isPro ? 'border-white bg-white' : 'border-zinc-600'
                }`}>
                  <Text className={`text-xs font-semibold ${
                    isPro ? 'text-black' : 'text-zinc-400'
                  }`}>
                    {isPro ? 'PRO' : 'FREE'}
                  </Text>
                </View>
                {!isPro && profile && (
                  <Text className="text-xs text-zinc-500 ml-2">
                    {3 - (profile.daily_generations || 0)} articles left today
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {!isPro && (
          <SettingsItem
            icon="star"
            title="Upgrade to Pro"
            subtitle="Unlimited articles, priority processing"
            onPress={handleUpgrade}
          />
        )}

        {isPro && (
          <SettingsItem
            icon="card"
            title="Manage Subscription"
            subtitle="Change or cancel your plan"
            onPress={handleManageSubscription}
          />
        )}

        {/* Playback Section */}
        <Text className="text-sm font-semibold text-zinc-500 mb-3 mt-6 uppercase tracking-wide">
          Playback
        </Text>

        <SettingsItem
          icon="speedometer"
          title="Default Playback Speed"
          subtitle="1.0x (Coming soon)"
          showChevron={false}
        />

        <SettingsItem
          icon="moon"
          title="Sleep Timer Default"
          subtitle="Off (Coming soon)"
          showChevron={false}
        />

        {/* Support Section */}
        <Text className="text-sm font-semibold text-zinc-500 mb-3 mt-6 uppercase tracking-wide">
          Support
        </Text>

        <SettingsItem
          icon="help-circle"
          title="Help & Support"
          onPress={handleSupport}
        />

        <SettingsItem
          icon="document-text"
          title="Privacy Policy"
          onPress={handlePrivacyPolicy}
        />

        <SettingsItem
          icon="document"
          title="Terms of Service"
          onPress={handleTermsOfService}
        />

        {/* Sign Out */}
        <Text className="text-sm font-semibold text-zinc-500 mb-3 mt-6 uppercase tracking-wide">
          Account Actions
        </Text>

        <SettingsItem
          icon="log-out"
          title="Sign Out"
          onPress={handleSignOut}
          showChevron={false}
          destructive
          loading={isSigningOut}
        />

        {/* App Version */}
        <View className="items-center mt-8 mb-6">
          <Text className="text-zinc-500 text-sm">tsucast v1.0.0</Text>
          <Text className="text-zinc-600 text-xs mt-1">
            Made with love
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
