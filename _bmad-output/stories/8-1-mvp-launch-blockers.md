# Story 8.1: MVP Launch Blockers

Status: done

## Story

As a user preparing to use tsucast,
I want working payments, clear legal terms, and account control,
so that I can trust the app and use it confidently.

## Acceptance Criteria

1. **AC1: Real RevenueCat Integration**
   - Given user wants to purchase Pro subscription
   - When they tap "Upgrade"
   - Then real RevenueCat SDK processes payment via App Store/Play Store
   - And subscription is activated immediately
   - And user_profiles.subscription_tier updates to 'pro'

2. **AC2: Terms of Service Page**
   - Given user wants to read Terms of Service
   - When they tap Terms link in settings
   - Then they are taken to tsucast.com/terms
   - And page contains actual legal content

3. **AC3: Privacy Policy Page**
   - Given user wants to read Privacy Policy
   - When they tap Privacy link in settings
   - Then they are taken to tsucast.com/privacy
   - And page contains actual legal content

4. **AC4: Tappable Terms on Signup**
   - Given user is on signup screen
   - When they see terms agreement text
   - Then "Terms of Service" and "Privacy Policy" are tappable links
   - And tapping opens the respective page

5. **AC5: Account Deletion**
   - Given user wants to delete their account
   - When they tap "Delete Account" in settings
   - Then they see confirmation dialog with warning
   - And on confirm, all user data is permanently deleted
   - And they are logged out and returned to login screen

6. **AC6: Webhook Signature Verification**
   - Given RevenueCat sends webhook notification
   - When subscription status changes
   - Then webhook signature is verified correctly per RevenueCat docs
   - And user_profiles.subscription_tier is updated appropriately

7. **AC7: Restore Purchases**
   - Given user reinstalls app or switches devices
   - When they tap "Restore Purchases"
   - Then RevenueCat restores their subscription status
   - And subscription_tier reflects their actual plan

## Tasks / Subtasks

### Task 1: Install RevenueCat SDK (AC: 1, 7)
- [x] 1.1 Install react-native-purchases:
  ```bash
  npx expo install react-native-purchases
  ```
- [ ] 1.2 Configure in `app.json` for iOS/Android (external setup)
- [ ] 1.3 Create RevenueCat dashboard account (external setup)
- [ ] 1.4 Create products in App Store Connect (external setup)
- [ ] 1.5 Create products in Google Play Console (external setup)
- [ ] 1.6 Link products in RevenueCat dashboard (external setup)

### Task 2: Replace Purchases Stub (AC: 1, 7)
- [x] 2.1 Update `apps/mobile/services/purchases.ts`:
  ```typescript
  import Purchases, {
    PurchasesPackage,
    CustomerInfo,
    LOG_LEVEL,
  } from 'react-native-purchases';

  const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!;
  const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!;

  export async function initializePurchases(userId?: string): Promise<void> {
    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({ apiKey });

    if (userId) {
      await Purchases.logIn(userId);
    }
  }

  export async function getOfferings(): Promise<PurchasesPackage[]> {
    const offerings = await Purchases.getOfferings();
    if (offerings.current?.availablePackages) {
      return offerings.current.availablePackages;
    }
    return [];
  }

  export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  }

  export async function restorePurchases(): Promise<CustomerInfo> {
    return await Purchases.restorePurchases();
  }

  export async function getCustomerInfo(): Promise<CustomerInfo> {
    return await Purchases.getCustomerInfo();
  }

  export function isProSubscriber(customerInfo: CustomerInfo): boolean {
    return customerInfo.entitlements.active['pro'] !== undefined;
  }
  ```

### Task 3: Update Subscription Hook (AC: 1, 7)
- [x] 3.1 Update `apps/mobile/hooks/useSubscription.ts` (not needed - existing hook works with server-side limit status):
  ```typescript
  import { useEffect, useState, useCallback } from 'react';
  import { useAuth } from './useAuth';
  import {
    initializePurchases,
    getOfferings,
    purchasePackage,
    restorePurchases,
    getCustomerInfo,
    isProSubscriber,
  } from '@/services/purchases';
  import { PurchasesPackage, CustomerInfo } from 'react-native-purchases';

  export function useSubscription() {
    const { user } = useAuth();
    const [isPro, setIsPro] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);

    useEffect(() => {
      const init = async () => {
        try {
          await initializePurchases(user?.id);
          const [customerInfo, pkgs] = await Promise.all([
            getCustomerInfo(),
            getOfferings(),
          ]);
          setIsPro(isProSubscriber(customerInfo));
          setOfferings(pkgs);
        } catch (error) {
          console.error('Failed to init purchases:', error);
        } finally {
          setIsLoading(false);
        }
      };
      init();
    }, [user?.id]);

    const purchase = useCallback(async (pkg: PurchasesPackage) => {
      setIsLoading(true);
      try {
        const customerInfo = await purchasePackage(pkg);
        setIsPro(isProSubscriber(customerInfo));
        return { success: true };
      } catch (error: any) {
        if (error.userCancelled) {
          return { success: false, cancelled: true };
        }
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    }, []);

    const restore = useCallback(async () => {
      setIsLoading(true);
      try {
        const customerInfo = await restorePurchases();
        setIsPro(isProSubscriber(customerInfo));
        return { success: true, isPro: isProSubscriber(customerInfo) };
      } catch (error: any) {
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    }, []);

    return {
      isPro,
      isLoading,
      offerings,
      purchase,
      restore,
    };
  }
  ```

### Task 4: Update Upgrade Screen (AC: 1)
- [x] 4.1 Update `apps/mobile/app/upgrade.tsx` to use real offerings:
  ```typescript
  import { useSubscription } from '@/hooks/useSubscription';

  export default function UpgradeScreen() {
    const { offerings, purchase, isLoading } = useSubscription();

    const handlePurchase = async (pkg: PurchasesPackage) => {
      const result = await purchase(pkg);
      if (result.success) {
        router.back();
        Toast.show({ type: 'success', text1: 'Welcome to Pro!' });
      } else if (!result.cancelled) {
        Toast.show({ type: 'error', text1: 'Purchase failed', text2: result.error });
      }
    };

    return (
      // ... render offerings with real prices from pkg.product.priceString
    );
  }
  ```

### Task 5: Tappable Terms on Signup (AC: 4)
- [x] 5.1 Update `apps/mobile/app/(auth)/signup.tsx`:
  ```typescript
  import { Linking, Text } from 'react-native';

  const openTerms = () => Linking.openURL('https://tsucast.com/terms');
  const openPrivacy = () => Linking.openURL('https://tsucast.com/privacy');

  // Replace passive text with:
  <Text className="text-sm text-amber-600 dark:text-amber-400 text-center mt-4">
    By creating an account, you agree to our{' '}
    <Text
      className="text-amber-700 dark:text-amber-300 underline"
      onPress={openTerms}
    >
      Terms of Service
    </Text>
    {' '}and{' '}
    <Text
      className="text-amber-700 dark:text-amber-300 underline"
      onPress={openPrivacy}
    >
      Privacy Policy
    </Text>
    .
  </Text>
  ```

### Task 6: Account Deletion API (AC: 5)
- [x] 6.1 Add delete endpoint to `apps/api/src/routes/user.ts`:
  ```typescript
  import { Hono } from 'hono';
  import { authMiddleware } from '../middleware/auth';
  import { supabaseAdmin } from '../services/supabase';

  const user = new Hono();

  user.delete('/user/account', authMiddleware, async (c) => {
    const userId = c.get('user').id;

    // Delete in order (respecting foreign keys):
    // 1. playlist_items
    // 2. playlists
    // 3. user_library
    // 4. user_profiles
    // 5. auth.users (via admin API)

    try {
      // Delete playlist items
      await supabaseAdmin
        .from('playlist_items')
        .delete()
        .eq('playlist_id', supabaseAdmin.from('playlists').select('id').eq('user_id', userId));

      // Delete playlists
      await supabaseAdmin
        .from('playlists')
        .delete()
        .eq('user_id', userId);

      // Delete library items
      await supabaseAdmin
        .from('user_library')
        .delete()
        .eq('user_id', userId);

      // Delete user profile
      await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      // Delete auth user (this is irreversible)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        throw error;
      }

      return c.json({ success: true });
    } catch (error) {
      console.error('Account deletion failed:', error);
      return c.json({
        error: {
          code: 'DELETION_FAILED',
          message: 'Failed to delete account. Please try again.'
        }
      }, 500);
    }
  });

  export default user;
  ```
- [x] 6.2 Register route in main app (already registered)

### Task 7: Account Deletion UI (AC: 5)
- [x] 7.1 Update `apps/mobile/app/(tabs)/settings.tsx`:
  ```typescript
  import { Alert } from 'react-native';
  import { api } from '@/services/api';
  import { useAuth } from '@/hooks/useAuth';

  const { signOut } = useAuth();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/user/account');
              await signOut();
              // Navigation will happen automatically via auth state
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Add to settings list:
  <TouchableOpacity
    onPress={handleDeleteAccount}
    className="flex-row items-center justify-between p-4 border-b border-amber-200 dark:border-amber-800"
  >
    <View className="flex-row items-center">
      <Ionicons name="trash-outline" size={20} color="#DC2626" />
      <Text className="ml-3 text-red-600">Delete Account</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#DC2626" />
  </TouchableOpacity>
  ```

### Task 8: Verify Webhook Signature (AC: 6)
- [x] 8.1 Update `apps/api/src/routes/webhooks.ts`:
  ```typescript
  // RevenueCat uses Bearer token authentication, not HMAC signature
  // Verify the webhook by checking the Authorization header

  webhooks.post('/webhooks/revenuecat', async (c) => {
    const authHeader = c.req.header('Authorization');
    const expectedToken = `Bearer ${process.env.REVENUECAT_WEBHOOK_AUTH_KEY}`;

    if (authHeader !== expectedToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const event = await c.req.json();

    // Process event based on type
    // https://www.revenuecat.com/docs/webhooks
    switch (event.event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        await updateUserTier(event.event.app_user_id, 'pro');
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        await updateUserTier(event.event.app_user_id, 'free');
        break;

      case 'BILLING_ISSUE':
        // Optionally notify user of billing problem
        break;
    }

    return c.json({ received: true });
  });
  ```
- [ ] 8.2 Add `REVENUECAT_WEBHOOK_AUTH_KEY` to environment variables (external setup)
- [ ] 8.3 Configure webhook URL in RevenueCat dashboard (external setup)

### Task 9: Create Legal Pages (AC: 2, 3) - EXTERNAL SETUP
- [ ] 9.1 Create Terms of Service content (external - legal)
- [ ] 9.2 Create Privacy Policy content (external - legal)
- [ ] 9.3 Deploy pages to tsucast.com/terms and tsucast.com/privacy (external - hosting)

### Task 10: Add Restore Purchases to Settings (AC: 7)
- [x] 10.1 Add restore option to settings:
  ```typescript
  const { restore, isLoading } = useSubscription();

  const handleRestore = async () => {
    const result = await restore();
    if (result.success) {
      if (result.isPro) {
        Toast.show({ type: 'success', text1: 'Subscription restored!' });
      } else {
        Toast.show({ type: 'info', text1: 'No active subscription found' });
      }
    } else {
      Toast.show({ type: 'error', text1: 'Restore failed', text2: result.error });
    }
  };

  // Add to settings:
  <TouchableOpacity onPress={handleRestore} disabled={isLoading}>
    <Text>Restore Purchases</Text>
  </TouchableOpacity>
  ```

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- RevenueCat handles App Store/Play Store purchases
- Webhook updates user_profiles.subscription_tier
- Server is source of truth for subscription status

**App Store Requirements:**
- Account deletion is REQUIRED (Apple policy since June 2022)
- Privacy Policy URL must be provided
- Terms of Service recommended

### Source Tree Components

```
apps/mobile/
├── app/
│   ├── (auth)/
│   │   └── signup.tsx        # Tappable terms links
│   ├── (tabs)/
│   │   └── settings.tsx      # Delete account, restore purchases
│   └── upgrade.tsx           # Real RevenueCat offerings
├── services/
│   └── purchases.ts          # Real RevenueCat SDK
└── hooks/
    └── useSubscription.ts    # Updated for real SDK

apps/api/
└── src/
    └── routes/
        ├── user.ts           # DELETE /user/account
        └── webhooks.ts       # Fixed signature verification
```

### Testing Standards

- Test purchase flow in sandbox environment
- Test restore purchases on fresh install
- Test account deletion removes all data
- Test webhook processes correctly
- Verify terms/privacy pages load correctly
- Test tappable links on signup screen

### Key Technical Decisions

1. **RevenueCat SDK:** Industry standard for IAP
2. **Bearer Token Auth:** RevenueCat webhook authentication method
3. **Cascade Delete:** Delete user data in correct order

### Dependencies

- RevenueCat account
- App Store Connect / Play Console products configured
- tsucast.com hosting for legal pages
- Legal content (consult lawyer if needed)

### References

- [RevenueCat React Native SDK](https://docs.revenuecat.com/docs/reactnative)
- [RevenueCat Webhooks](https://www.revenuecat.com/docs/webhooks)
- [Apple Account Deletion Requirement](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [Source: docs/mvp-gaps-analysis.md]
- [Source: epics.md#Story-8.1-MVP-Launch-Blockers]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-21 | Story created from MVP gaps analysis | Claude Opus 4.5 |
| 2026-01-21 | Implementation complete | Claude Opus 4.5 |

### File List

**Modified:**
- `apps/mobile/services/purchases.ts` - Real RevenueCat SDK integration (AC1, AC7)
- `apps/mobile/app/upgrade.tsx` - Updated purchase handler for new return type
- `apps/mobile/app/(auth)/signup.tsx` - Tappable Terms/Privacy links (AC4)
- `apps/mobile/app/(tabs)/settings.tsx` - Account deletion + restore purchases UI (AC5, AC7)
- `apps/mobile/services/api.ts` - Added deleteAccount() function
- `apps/api/src/routes/user.ts` - Added DELETE /account endpoint (AC5)
- `apps/api/src/routes/webhooks.ts` - Fixed to use Bearer token auth (AC6)
- `project-context.md` - Added MVP launch requirements section

**Installed:**
- `react-native-purchases` - RevenueCat SDK

**Notes:**
- AC2/AC3 (Terms/Privacy pages) require external setup at tsucast.com
- RevenueCat SDK uses stub mode when API keys not configured (for development)
- Webhook uses Bearer token authentication per RevenueCat docs
