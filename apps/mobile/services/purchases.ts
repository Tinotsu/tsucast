/**
 * Purchases Service
 *
 * RevenueCat SDK wrapper for in-app purchases.
 * Story: 5-3 In-App Purchase Integration, 8-1 MVP Launch Blockers
 *
 * This service uses the RevenueCat SDK for production purchases.
 * When API keys are not configured, it falls back to stub data for development.
 */

import { Platform } from 'react-native';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOfferings,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';

// Re-export types for consumers
export type { PurchasesPackage, CustomerInfo, PurchasesOfferings };

// Environment variables (set in .env)
const API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS || '';
const API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID || '';

// Track initialization state
let isInitialized = false;

/**
 * Check if RevenueCat is configured with API keys
 */
export function isPurchasesConfigured(): boolean {
  const key = Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;
  return key.length > 0;
}

/**
 * Initialize RevenueCat SDK
 * Call this after user authentication
 */
export async function initializePurchases(userId?: string): Promise<void> {
  if (isInitialized) {
    // Already initialized, just login if userId provided
    if (userId) {
      try {
        await Purchases.logIn(userId);
      } catch (error) {
        if (__DEV__) {
          console.log('[Purchases] Login failed:', error);
        }
      }
    }
    return;
  }

  if (!isPurchasesConfigured()) {
    if (__DEV__) {
      console.log('[Purchases] Not configured - using stub mode');
    }
    return;
  }

  const apiKey = Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({
      apiKey,
      appUserID: userId,
    });

    isInitialized = true;

    if (__DEV__) {
      console.log('[Purchases] Initialized successfully');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[Purchases] Initialization failed:', error);
    }
    throw error;
  }
}

/**
 * Get available subscription offerings
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isPurchasesConfigured()) {
    // Return mock offerings for development
    return {
      all: {},
      current: {
        identifier: 'default',
        serverDescription: 'Default offering',
        metadata: {},
        availablePackages: [
          {
            identifier: '$rc_monthly',
            packageType: 'MONTHLY',
            product: {
              identifier: 'tsucast_pro_monthly',
              description: 'Unlimited article conversions',
              title: 'tsucast Pro Monthly',
              price: 9.99,
              priceString: '$9.99',
              pricePerMonth: 9.99,
              pricePerMonthString: '$9.99',
              pricePerYear: 119.88,
              pricePerYearString: '$119.88',
              currencyCode: 'USD',
              introPrice: null,
              discounts: [],
              productCategory: 'SUBSCRIPTION',
              productType: 'AUTO_RENEWABLE_SUBSCRIPTION',
              subscriptionPeriod: 'P1M',
              defaultOption: null,
              presentedOfferingIdentifier: 'default',
              presentedOfferingContext: null,
            },
            offeringIdentifier: 'default',
            presentedOfferingContext: {
              offeringIdentifier: 'default',
              placementIdentifier: null,
              targetingContext: null,
            },
          } as unknown as PurchasesPackage,
        ],
        annual: null,
        monthly: null,
        weekly: null,
        twoMonth: null,
        threeMonth: null,
        sixMonth: null,
        lifetime: null,
      },
    } as unknown as PurchasesOfferings;
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    if (__DEV__) {
      console.error('[Purchases] Failed to get offerings:', error);
    }
    return null;
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ customerInfo: CustomerInfo | null; cancelled: boolean }> {
  if (!isPurchasesConfigured()) {
    if (__DEV__) {
      console.log('[Purchases] Mock purchase:', pkg.identifier);
    }
    // Return mock success for development
    return {
      customerInfo: {
        entitlements: {
          active: {
            pro: {
              identifier: 'pro',
              isActive: true,
              willRenew: true,
              periodType: 'NORMAL',
              latestPurchaseDate: new Date().toISOString(),
              latestPurchaseDateMillis: Date.now(),
              originalPurchaseDate: new Date().toISOString(),
              originalPurchaseDateMillis: Date.now(),
              expirationDate: null,
              expirationDateMillis: null,
              store: 'APP_STORE',
              productIdentifier: 'tsucast_pro_monthly',
              isSandbox: true,
              unsubscribeDetectedAt: null,
              unsubscribeDetectedAtMillis: null,
              billingIssueDetectedAt: null,
              billingIssueDetectedAtMillis: null,
              ownershipType: 'PURCHASED',
              productPlanIdentifier: null,
            },
          },
          all: {},
          verification: 'NOT_REQUESTED',
        },
        activeSubscriptions: ['tsucast_pro_monthly'],
        allPurchasedProductIdentifiers: ['tsucast_pro_monthly'],
        latestExpirationDate: null,
        latestExpirationDateMillis: null,
        firstSeen: new Date().toISOString(),
        firstSeenMillis: Date.now(),
        originalAppUserId: 'mock-user',
        requestDate: new Date().toISOString(),
        requestDateMillis: Date.now(),
        allExpirationDates: {},
        allExpirationDatesMillis: {},
        allPurchaseDates: {},
        allPurchaseDatesMillis: {},
        originalApplicationVersion: null,
        originalPurchaseDate: null,
        originalPurchaseDateMillis: null,
        managementURL: null,
        nonSubscriptionTransactions: [],
      } as unknown as CustomerInfo,
      cancelled: false,
    };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { customerInfo, cancelled: false };
  } catch (error: unknown) {
    const purchaseError = error as { code?: string; userCancelled?: boolean };

    // Check if user cancelled
    if (
      purchaseError.userCancelled ||
      purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    ) {
      return { customerInfo: null, cancelled: true };
    }

    throw error;
  }
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isPurchasesConfigured()) {
    // Return mock free user for development
    return {
      entitlements: {
        active: {},
        all: {},
        verification: 'NOT_REQUESTED',
      },
      activeSubscriptions: [],
      allPurchasedProductIdentifiers: [],
      latestExpirationDate: null,
      latestExpirationDateMillis: null,
      firstSeen: new Date().toISOString(),
      firstSeenMillis: Date.now(),
      originalAppUserId: 'mock-user',
      requestDate: new Date().toISOString(),
      requestDateMillis: Date.now(),
      allExpirationDates: {},
      allExpirationDatesMillis: {},
      allPurchaseDates: {},
      allPurchaseDatesMillis: {},
      originalApplicationVersion: null,
      originalPurchaseDate: null,
      originalPurchaseDateMillis: null,
      managementURL: null,
      nonSubscriptionTransactions: [],
    } as unknown as CustomerInfo;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    if (__DEV__) {
      console.error('[Purchases] Failed to get customer info:', error);
    }
    return null;
  }
}

/**
 * Restore purchases (required by App Store guidelines)
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isPurchasesConfigured()) {
    if (__DEV__) {
      console.log('[Purchases] Mock restore - no purchases found');
    }
    return {
      entitlements: {
        active: {},
        all: {},
        verification: 'NOT_REQUESTED',
      },
      activeSubscriptions: [],
      allPurchasedProductIdentifiers: [],
      latestExpirationDate: null,
      latestExpirationDateMillis: null,
      firstSeen: new Date().toISOString(),
      firstSeenMillis: Date.now(),
      originalAppUserId: 'mock-user',
      requestDate: new Date().toISOString(),
      requestDateMillis: Date.now(),
      allExpirationDates: {},
      allExpirationDatesMillis: {},
      allPurchaseDates: {},
      allPurchaseDatesMillis: {},
      originalApplicationVersion: null,
      originalPurchaseDate: null,
      originalPurchaseDateMillis: null,
      managementURL: null,
      nonSubscriptionTransactions: [],
    } as unknown as CustomerInfo;
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    if (__DEV__) {
      console.error('[Purchases] Failed to restore purchases:', error);
    }
    throw error;
  }
}

/**
 * Check if customer has pro entitlement
 */
export function isPro(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false;
  return customerInfo.entitlements.active['pro'] !== undefined;
}

/**
 * Open platform subscription management
 */
export function openSubscriptionSettings(): void {
  const { Linking } = require('react-native');

  if (Platform.OS === 'ios') {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  } else {
    Linking.openURL('https://play.google.com/store/account/subscriptions');
  }
}
