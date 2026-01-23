/**
 * RevenueCat Service
 *
 * Server-side RevenueCat REST API integration for subscription management.
 * Used for verifying subscription status and syncing with database.
 *
 * API Reference: https://www.revenuecat.com/docs/api-v1
 */

import { logger } from '../lib/logger.js';

const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1';
const API_KEY = process.env.REVENUECAT_API_SECRET_KEY || '';

interface RevenueCatEntitlement {
  expires_date: string | null;
  grace_period_expires_date: string | null;
  product_identifier: string;
  purchase_date: string;
}

interface RevenueCatSubscriber {
  entitlements: Record<string, RevenueCatEntitlement>;
  subscriptions: Record<string, {
    expires_date: string | null;
    purchase_date: string;
    original_purchase_date: string;
    store: string;
    is_sandbox: boolean;
    unsubscribe_detected_at: string | null;
    billing_issues_detected_at: string | null;
  }>;
  non_subscriptions: Record<string, Array<{
    id: string;
    purchase_date: string;
    store: string;
  }>>;
  first_seen: string;
  management_url: string | null;
  original_app_user_id: string;
  original_application_version: string | null;
}

interface GetSubscriberResponse {
  request_date: string;
  request_date_ms: number;
  subscriber: RevenueCatSubscriber;
}

/**
 * Check if RevenueCat API is configured
 */
export function isRevenueCatConfigured(): boolean {
  return API_KEY.length > 0;
}

/**
 * Get subscriber information from RevenueCat
 */
export async function getSubscriber(appUserId: string): Promise<RevenueCatSubscriber | null> {
  if (!isRevenueCatConfigured()) {
    logger.warn('RevenueCat API not configured');
    return null;
  }

  try {
    const response = await fetch(`${REVENUECAT_API_URL}/subscribers/${encodeURIComponent(appUserId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-Platform': 'stripe', // For web billing
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Subscriber not found - this is normal for new users
        logger.debug({ appUserId }, 'Subscriber not found in RevenueCat');
        return null;
      }
      throw new Error(`RevenueCat API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GetSubscriberResponse;
    return data.subscriber;
  } catch (error) {
    logger.error({ error, appUserId }, 'Failed to fetch subscriber from RevenueCat');
    return null;
  }
}

/**
 * Check if subscriber has active "Tsucast Pro" entitlement
 */
export async function hasProEntitlement(appUserId: string): Promise<boolean> {
  const subscriber = await getSubscriber(appUserId);

  if (!subscriber) {
    return false;
  }

  // Check for "Tsucast Pro" entitlement (case-insensitive check)
  const proEntitlement = subscriber.entitlements['Tsucast Pro'] || subscriber.entitlements['pro'];

  if (!proEntitlement) {
    return false;
  }

  // Check if entitlement is still valid
  if (proEntitlement.expires_date) {
    const expiresAt = new Date(proEntitlement.expires_date);
    if (expiresAt < new Date()) {
      return false;
    }
  }

  return true;
}

/**
 * Get subscription details for a user
 */
export async function getSubscriptionDetails(appUserId: string): Promise<{
  isPro: boolean;
  expiresAt: string | null;
  productId: string | null;
  managementUrl: string | null;
  store: string | null;
} | null> {
  const subscriber = await getSubscriber(appUserId);

  if (!subscriber) {
    return null;
  }

  const proEntitlement = subscriber.entitlements['Tsucast Pro'] || subscriber.entitlements['pro'];

  if (!proEntitlement) {
    return {
      isPro: false,
      expiresAt: null,
      productId: null,
      managementUrl: subscriber.management_url,
      store: null,
    };
  }

  // Check if still valid
  let isPro = true;
  if (proEntitlement.expires_date) {
    const expiresAt = new Date(proEntitlement.expires_date);
    isPro = expiresAt >= new Date();
  }

  // Find the subscription details
  const subscription = subscriber.subscriptions[proEntitlement.product_identifier];

  return {
    isPro,
    expiresAt: proEntitlement.expires_date,
    productId: proEntitlement.product_identifier,
    managementUrl: subscriber.management_url,
    store: subscription?.store || null,
  };
}

/**
 * Create or get subscriber (used for web purchases)
 */
export async function createOrGetSubscriber(appUserId: string, attributes?: {
  email?: string;
  displayName?: string;
}): Promise<RevenueCatSubscriber | null> {
  if (!isRevenueCatConfigured()) {
    logger.warn('RevenueCat API not configured');
    return null;
  }

  try {
    // First try to get existing subscriber
    const existing = await getSubscriber(appUserId);
    if (existing) {
      return existing;
    }

    // Create new subscriber by making a GET request with attributes
    const response = await fetch(`${REVENUECAT_API_URL}/subscribers/${encodeURIComponent(appUserId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-Platform': 'stripe',
      },
    });

    if (response.ok) {
      const data = await response.json() as GetSubscriberResponse;

      // Update subscriber attributes if provided
      if (attributes && (attributes.email || attributes.displayName)) {
        await updateSubscriberAttributes(appUserId, attributes);
      }

      return data.subscriber;
    }

    return null;
  } catch (error) {
    logger.error({ error, appUserId }, 'Failed to create/get subscriber');
    return null;
  }
}

/**
 * Delete/anonymize subscriber data in RevenueCat
 *
 * This should be called when a user deletes their account.
 * RevenueCat will anonymize all subscriber data.
 *
 * Note: This does NOT cancel active subscriptions - users must do that
 * through App Store/Play Store. We just disassociate the user ID.
 *
 * API Reference: https://www.revenuecat.com/docs/api-v1#tag/customers/operation/delete-subscriber
 */
export async function deleteSubscriber(appUserId: string): Promise<boolean> {
  if (!isRevenueCatConfigured()) {
    logger.warn('RevenueCat API not configured, skipping subscriber deletion');
    return true; // Not an error if not configured
  }

  try {
    const response = await fetch(`${REVENUECAT_API_URL}/subscribers/${encodeURIComponent(appUserId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Subscriber not found - that's fine, nothing to delete
        logger.debug({ appUserId }, 'RevenueCat subscriber not found for deletion');
        return true;
      }
      throw new Error(`RevenueCat API error: ${response.status} ${response.statusText}`);
    }

    logger.info({ appUserId }, 'RevenueCat subscriber data deleted/anonymized');
    return true;
  } catch (error) {
    logger.error({ error, appUserId }, 'Failed to delete RevenueCat subscriber');
    return false;
  }
}

/**
 * Update subscriber attributes
 */
async function updateSubscriberAttributes(appUserId: string, attributes: {
  email?: string;
  displayName?: string;
}): Promise<void> {
  if (!isRevenueCatConfigured()) {
    return;
  }

  try {
    const body: Record<string, { value: string }> = {};

    if (attributes.email) {
      body['$email'] = { value: attributes.email };
    }
    if (attributes.displayName) {
      body['$displayName'] = { value: attributes.displayName };
    }

    await fetch(`${REVENUECAT_API_URL}/subscribers/${encodeURIComponent(appUserId)}/attributes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attributes: body }),
    });
  } catch (error) {
    logger.error({ error, appUserId }, 'Failed to update subscriber attributes');
  }
}
