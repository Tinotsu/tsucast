# Story 5.3: In-App Purchase Integration

Status: ready-for-dev

## Story

As a user who wants to upgrade,
I want to subscribe via App Store,
so that payment is secure and familiar.

## Acceptance Criteria

1. **AC1: Subscription Screen**
   - Given user taps "Upgrade"
   - When subscription screen loads
   - Then they see plan options with pricing
   - And "Unlimited articles" benefit highlighted

2. **AC2: Purchase Flow**
   - Given user selects a plan
   - When they confirm purchase
   - Then RevenueCat processes the payment
   - And App Store/Play Store handles transaction

3. **AC3: Purchase Success**
   - Given purchase succeeds
   - When confirmation received
   - Then user_profiles.subscription_tier updates to 'pro'
   - And user sees success message
   - And limits are removed immediately

4. **AC4: Purchase Failure**
   - Given purchase fails
   - When error occurs
   - Then user sees friendly error
   - And can try again later

5. **AC5: Subscription Management**
   - Given user wants to manage subscription
   - When they tap "Manage Subscription"
   - Then they're directed to App Store/Play Store settings
   - And can cancel or modify there

## Tasks / Subtasks

### Task 1: RevenueCat Setup (AC: 2, 3)
- [ ] 1.1 Create RevenueCat account and project
- [ ] 1.2 Configure App Store Connect:
  - Create in-app purchase product (subscription)
  - Product ID: `tsucast_pro_monthly`
  - Price: $9.99/month
  - Configure subscription group
- [ ] 1.3 Configure Google Play Console:
  - Create subscription product
  - Same product ID
  - Same pricing
- [ ] 1.4 Add products to RevenueCat project
- [ ] 1.5 Get API keys for iOS and Android

### Task 2: RevenueCat SDK Installation (AC: 2)
- [ ] 2.1 Install RevenueCat SDK:
  ```bash
  npm install react-native-purchases
  npx expo install expo-build-properties
  ```
- [ ] 2.2 Configure app.json/expo plugins if needed
- [ ] 2.3 Create `services/purchases.ts`:
  ```typescript
  import Purchases, {
    PurchasesOfferings,
    CustomerInfo,
    PurchasesPackage,
  } from 'react-native-purchases';
  import { Platform } from 'react-native';

  const API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS!;
  const API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID!;

  export async function initializePurchases(userId?: string) {
    await Purchases.configure({
      apiKey: Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID,
      appUserID: userId,
    });
  }

  export async function getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    } catch (error) {
      if (error.userCancelled) {
        return null; // User cancelled, not an error
      }
      throw error;
    }
  }

  export async function getCustomerInfo(): Promise<CustomerInfo> {
    return Purchases.getCustomerInfo();
  }

  export async function restorePurchases(): Promise<CustomerInfo> {
    return Purchases.restorePurchases();
  }

  export function isPro(customerInfo: CustomerInfo): boolean {
    return customerInfo.entitlements.active['pro'] !== undefined;
  }
  ```

### Task 3: Initialize RevenueCat on App Start (AC: 2, 3)
- [ ] 3.1 Update `app/_layout.tsx`:
  ```typescript
  import { initializePurchases } from '@/services/purchases';

  export default function RootLayout() {
    const { user } = useAuth();

    useEffect(() => {
      if (user) {
        initializePurchases(user.id);
      }
    }, [user?.id]);

    // ... rest of layout
  }
  ```

### Task 4: Upgrade Screen with Purchases (AC: 1, 2)
- [ ] 4.1 Update `app/upgrade.tsx`:
  ```typescript
  import {
    getOfferings,
    purchasePackage,
    restorePurchases,
    isPro
  } from '@/services/purchases';

  export default function UpgradeScreen() {
    const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);

    useEffect(() => {
      getOfferings().then((data) => {
        setOfferings(data);
        setIsLoading(false);
      });
    }, []);

    const handlePurchase = async () => {
      const pkg = offerings?.current?.availablePackages[0];
      if (!pkg) return;

      setIsPurchasing(true);
      try {
        const customerInfo = await purchasePackage(pkg);
        if (customerInfo && isPro(customerInfo)) {
          // Success!
          Toast.show({
            type: 'success',
            text1: 'Welcome to Pro!',
            text2: 'Enjoy unlimited articles',
          });
          router.back();
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Purchase failed',
          text2: 'Please try again later',
        });
      } finally {
        setIsPurchasing(false);
      }
    };

    const handleRestore = async () => {
      setIsLoading(true);
      try {
        const customerInfo = await restorePurchases();
        if (isPro(customerInfo)) {
          Toast.show({
            type: 'success',
            text1: 'Subscription restored!',
          });
          router.back();
        } else {
          Toast.show({
            type: 'info',
            text1: 'No active subscription found',
          });
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Restore failed',
          text2: 'Please try again',
        });
      } finally {
        setIsLoading(false);
      }
    };

    const pkg = offerings?.current?.availablePackages[0];
    const price = pkg?.product.priceString || '$9.99';

    return (
      <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown">
        <ScrollView className="flex-1 p-6">
          {/* ... header and benefits */}

          {/* Price */}
          <View className="bg-amber-100 dark:bg-amber-900 rounded-2xl p-6 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-amber-900 dark:text-amber-100">
                Pro
              </Text>
              <View className="flex-row items-baseline">
                <Text className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                  {price}
                </Text>
                <Text className="text-amber-700 dark:text-amber-300">/month</Text>
              </View>
            </View>

            {/* Benefits list */}
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={isLoading || isPurchasing || !pkg}
            className={cn(
              'py-4 rounded-xl',
              isPurchasing ? 'bg-amber-400' : 'bg-amber-500'
            )}
          >
            {isPurchasing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-center text-lg">
                Subscribe for {price}/month
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore */}
          <TouchableOpacity onPress={handleRestore} className="mt-4 py-3">
            <Text className="text-amber-600 dark:text-amber-400 text-center">
              Restore Purchase
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text className="mt-6 text-xs text-amber-500 text-center">
            Payment will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account.
            Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
  ```

### Task 5: RevenueCat Webhook for Server Sync (AC: 3)
- [ ] 5.1 Create `apps/api/src/routes/webhooks.ts`:
  ```typescript
  import { Hono } from 'hono';
  import { supabase } from '../services/supabase';
  import crypto from 'crypto';

  const webhooks = new Hono();

  webhooks.post('/webhooks/revenuecat', async (c) => {
    // Verify webhook signature
    const signature = c.req.header('X-RevenueCat-Signature');
    const body = await c.req.text();

    const expectedSignature = crypto
      .createHmac('sha256', process.env.REVENUECAT_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    const event = JSON.parse(body);

    // Handle subscription events
    switch (event.event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        // User subscribed or renewed
        await supabase
          .from('user_profiles')
          .update({ subscription_tier: 'pro' })
          .eq('id', event.event.app_user_id);
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        // Subscription ended
        await supabase
          .from('user_profiles')
          .update({ subscription_tier: 'free' })
          .eq('id', event.event.app_user_id);
        break;
    }

    return c.json({ received: true });
  });

  export default webhooks;
  ```
- [ ] 5.2 Configure RevenueCat webhook URL in dashboard
- [ ] 5.3 Set webhook secret in environment

### Task 6: Subscription Status Sync (AC: 3)
- [ ] 6.1 Update `hooks/useSubscription.ts` to check RevenueCat:
  ```typescript
  import { getCustomerInfo, isPro } from '@/services/purchases';

  export function useSubscription() {
    const [tier, setTier] = useState<'free' | 'pro'>('free');

    useEffect(() => {
      const checkSubscription = async () => {
        try {
          const customerInfo = await getCustomerInfo();
          setTier(isPro(customerInfo) ? 'pro' : 'free');
        } catch (error) {
          console.error('Failed to check subscription:', error);
        }
      };

      checkSubscription();

      // Listen for subscription changes
      Purchases.addCustomerInfoUpdateListener((info) => {
        setTier(isPro(info) ? 'pro' : 'free');
      });
    }, []);

    // ... rest of hook
  }
  ```

### Task 7: Manage Subscription Link (AC: 5)
- [ ] 7.1 Add to settings screen:
  ```typescript
  import { Linking, Platform } from 'react-native';

  const openSubscriptionSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  // In settings screen
  {isPro && (
    <TouchableOpacity onPress={openSubscriptionSettings}>
      <Text>Manage Subscription</Text>
    </TouchableOpacity>
  )}
  ```

### Task 8: Environment Variables (AC: 2)
- [ ] 8.1 Add to `.env`:
  ```bash
  EXPO_PUBLIC_REVENUECAT_IOS=appl_xxxxx
  EXPO_PUBLIC_REVENUECAT_ANDROID=goog_xxxxx
  REVENUECAT_WEBHOOK_SECRET=xxxxx
  ```

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- RevenueCat handles all payment processing
- Webhook syncs subscription status to database
- App Store/Play Store handle actual payments
- PCI compliance via RevenueCat

**Purchase Flow:**
1. User taps Subscribe
2. RevenueCat SDK presents native purchase UI
3. App Store/Play Store processes payment
4. RevenueCat confirms purchase
5. Webhook updates user_profiles
6. Client reflects new status

### Source Tree Components

```
apps/mobile/
├── app/
│   ├── upgrade.tsx          # Purchase screen
│   └── settings.tsx         # Manage subscription
├── services/
│   └── purchases.ts         # RevenueCat SDK wrapper
└── hooks/
    └── useSubscription.ts   # Status sync

apps/api/
└── src/routes/
    └── webhooks.ts          # RevenueCat webhook
```

### Testing Standards

- Test purchase flow in sandbox (TestFlight/Internal Testing)
- Test restore purchases
- Test subscription expiry
- Test webhook updates database
- Test cancel flow via App Store/Play Store
- Test new device → restore works

### Key Technical Decisions

1. **RevenueCat:** Industry standard, handles complexity
2. **Webhook Sync:** Server knows subscription status
3. **Client Check:** Also check RevenueCat directly for speed
4. **Restore:** Required by App Store guidelines

### Store Requirements

**Apple App Store:**
- Subscription must auto-renew
- Must have restore button
- Must show clear pricing
- Terms of service visible

**Google Play:**
- Similar requirements
- Must handle subscription status updates

### Dependencies

- Story 5-2 must be completed (upgrade screen exists)
- App Store Connect and Play Console configured
- RevenueCat account set up

### References

- [Source: architecture-v2.md#Technology-Stack] (RevenueCat)
- [Source: epics.md#Story-5.3-In-App-Purchase-Integration]
- [Source: prd.md#FR42-FR44]
- [RevenueCat React Native](https://www.revenuecat.com/docs/getting-started/installation/reactnative)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
