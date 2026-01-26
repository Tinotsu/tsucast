/**
 * CreditPurchaseModal Component
 *
 * Modal for purchasing credit packs via IAP.
 * Story: 10-2 Mobile Article Credit Pricing
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Credit pack definitions
export interface CreditPack {
  id: string;
  emoji: string;
  name: string;
  credits: number;
  price: string;
  recommended?: boolean;
  best?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'candy', emoji: '🍬', name: 'Candy', credits: 3, price: '$2.99' },
  { id: 'coffee', emoji: '☕', name: 'Coffee', credits: 5, price: '$4.99', recommended: true },
  { id: 'kebab', emoji: '🥙', name: 'Kebab', credits: 10, price: '$8.99' },
  { id: 'pizza', emoji: '🍕', name: 'Pizza', credits: 20, price: '$16.99' },
  { id: 'feast', emoji: '🍱', name: 'Feast', credits: 50, price: '$39.99', best: true },
];

interface CreditPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: (packId: string) => Promise<void>;
  currentCredits?: number;
}

export function CreditPurchaseModal({
  visible,
  onClose,
  onPurchase,
  currentCredits = 0,
}: CreditPurchaseModalProps) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async (packId: string) => {
    setSelectedPack(packId);
    setIsPurchasing(true);
    try {
      await onPurchase(packId);
      onClose();
    } catch (error) {
      if (__DEV__) {
        console.error('Purchase failed:', error);
      }
    } finally {
      setIsPurchasing(false);
      setSelectedPack(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
          <Text className="text-xl font-bold text-white">Buy Credits</Text>
          <Pressable
            onPress={onClose}
            className="p-2"
            disabled={isPurchasing}
          >
            <Text className="text-amber-500 font-medium">Done</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Current Balance */}
          {currentCredits > 0 && (
            <View className="flex-row items-center gap-2 mb-6">
              <Text className="text-zinc-400">Current balance:</Text>
              <Text className="text-white font-semibold">
                🎫 {currentCredits} credits
              </Text>
            </View>
          )}

          {/* Credit Packs */}
          <View className="gap-3">
            {CREDIT_PACKS.map((pack) => (
              <Pressable
                key={pack.id}
                onPress={() => handlePurchase(pack.id)}
                disabled={isPurchasing}
                className={`
                  flex-row items-center justify-between p-4 rounded-xl border
                  ${pack.recommended
                    ? 'bg-amber-900/20 border-amber-600'
                    : pack.best
                      ? 'bg-purple-900/20 border-purple-600'
                      : 'bg-zinc-900 border-zinc-800'
                  }
                  ${isPurchasing && selectedPack === pack.id ? 'opacity-50' : ''}
                `}
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-3xl">{pack.emoji}</Text>
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg font-semibold text-white">
                        {pack.name}
                      </Text>
                      {pack.recommended && (
                        <View className="bg-amber-600 px-2 py-0.5 rounded">
                          <Text className="text-xs text-white font-medium">
                            POPULAR
                          </Text>
                        </View>
                      )}
                      {pack.best && (
                        <View className="bg-purple-600 px-2 py-0.5 rounded">
                          <Text className="text-xs text-white font-medium">
                            BEST VALUE
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-zinc-400">
                      {pack.credits} credits
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  {isPurchasing && selectedPack === pack.id ? (
                    <ActivityIndicator size="small" color="#f59e0b" />
                  ) : (
                    <Text className="text-lg font-bold text-white">
                      {pack.price}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          {/* Benefits */}
          <View className="mt-8 gap-3">
            <Text className="text-zinc-400 text-sm font-medium uppercase tracking-wide">
              Benefits
            </Text>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Text>♾️</Text>
                <Text className="text-zinc-300">Credits never expire</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text>💸</Text>
                <Text className="text-zinc-300">No subscription needed</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text>📖</Text>
                <Text className="text-zinc-300">
                  Short articles? Leftover time banks for later
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text>💰</Text>
                <Text className="text-zinc-300">7-day money back guarantee</Text>
              </View>
            </View>
          </View>

          {/* Pricing explanation */}
          <View className="mt-6 p-4 bg-zinc-900 rounded-xl">
            <Text className="text-zinc-300 text-sm leading-relaxed">
              1 credit = 1 article (up to 20 min of audio). Short articles?
              The leftover time rolls over to your time bank for the next one.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
