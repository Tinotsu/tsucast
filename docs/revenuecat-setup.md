# RevenueCat Configuration Guide

> Story 9-4: RevenueCat Configuration for tsucast

## Overview

RevenueCat manages in-app subscriptions for tsucast across iOS and Android platforms. This guide covers the setup required for production deployment.

## Prerequisites

- RevenueCat account (https://app.revenuecat.com)
- Apple Developer account with App Store Connect access
- Google Play Console account
- Production API endpoint deployed

## 1. RevenueCat Project Setup

### Create Project

1. Log in to RevenueCat dashboard
2. Click "Create New Project"
3. Name: `tsucast`
4. Select platforms: iOS, Android

### Configure API Keys

After project creation, note the following keys from **Project Settings > API Keys**:

```env
# Add to mobile app configuration
REVENUECAT_PUBLIC_API_KEY_IOS=<ios-public-key>
REVENUECAT_PUBLIC_API_KEY_ANDROID=<android-public-key>
```

## 2. App Store Configuration (iOS)

### Connect App Store Connect

1. In RevenueCat: **Apps > iOS App > App Store Connect**
2. Enter App Store Connect credentials or use App Store Connect API key
3. Bundle ID: `app.tsucast` (must match Xcode project)

### Create Products in App Store Connect

1. Go to App Store Connect > Your App > Subscriptions
2. Create Subscription Group: `tsucast_pro`
3. Add subscriptions:

| Reference Name | Product ID | Duration | Price |
|----------------|------------|----------|-------|
| Pro Monthly | `tsucast_pro_monthly` | 1 Month | $9.99 |
| Pro Yearly | `tsucast_pro_yearly` | 1 Year | $79.99 |

### Configure in RevenueCat

1. **Products > Add Product**
2. Import from App Store Connect
3. Map products to entitlements (see below)

## 3. Google Play Configuration (Android)

### Connect Google Play Console

1. In RevenueCat: **Apps > Android App > Google Play Console**
2. Create Service Account with financial permissions
3. Upload JSON key file
4. Package name: `app.tsucast`

### Create Products in Google Play Console

1. Go to Google Play Console > Your App > Monetize > Products > Subscriptions
2. Create subscriptions:

| Product ID | Name | Billing Period | Price |
|------------|------|----------------|-------|
| `tsucast_pro_monthly` | tsucast Pro (Monthly) | Monthly | $9.99 |
| `tsucast_pro_yearly` | tsucast Pro (Yearly) | Yearly | $79.99 |

### Configure in RevenueCat

1. **Products > Add Product**
2. Import from Google Play
3. Map products to entitlements

## 4. Entitlements Configuration

### Create Entitlement

1. **Entitlements > Add New**
2. Identifier: `pro`
3. Description: "tsucast Pro - Unlimited generations"

### Map Products to Entitlement

1. Select `pro` entitlement
2. Attach products:
   - `tsucast_pro_monthly`
   - `tsucast_pro_yearly`

## 5. Offerings Configuration

### Create Offering

1. **Offerings > Add New Offering**
2. Identifier: `default`
3. Add packages:

| Package | Type | Product |
|---------|------|---------|
| Monthly | Monthly | `tsucast_pro_monthly` |
| Annual | Annual | `tsucast_pro_yearly` |

## 6. Webhook Configuration

### Set Up Server-to-Server Webhook

1. **Project Settings > Webhooks > Add New**
2. Configure webhook:

```yaml
URL: https://api.tsucast.app/api/webhooks/revenuecat
Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH_KEY>
```

3. Select events to send:
   - `INITIAL_PURCHASE`
   - `RENEWAL`
   - `CANCELLATION`
   - `EXPIRATION`
   - `BILLING_ISSUE`
   - `PRODUCT_CHANGE`

### Environment Variables (API Server)

Add to production environment:

```env
REVENUECAT_WEBHOOK_AUTH_KEY=<generate-secure-random-key>
```

Generate key:
```bash
openssl rand -base64 32
```

## 7. Testing

### Sandbox Testing (iOS)

1. Create Sandbox tester in App Store Connect
2. Sign out of App Store on device
3. Make test purchase (will use sandbox account)

### Testing (Android)

1. Add tester email to License Testing in Google Play Console
2. Upload to Internal Testing track
3. Test purchases are free for license testers

### Verify Webhook

1. Make sandbox purchase
2. Check RevenueCat dashboard for webhook logs
3. Verify user's `subscription_tier` updated in database

## 8. Production Checklist

- [ ] RevenueCat project created
- [ ] iOS app connected to App Store Connect
- [ ] Android app connected to Google Play Console
- [ ] Products created in both stores
- [ ] Products imported to RevenueCat
- [ ] `pro` entitlement configured
- [ ] Products attached to entitlement
- [ ] `default` offering created with packages
- [ ] Webhook URL configured
- [ ] `REVENUECAT_WEBHOOK_AUTH_KEY` set in production
- [ ] Sandbox purchase tested
- [ ] Webhook delivery verified
- [ ] User tier update verified in database

## API Webhook Handler

The webhook handler is implemented at:

```
apps/api/src/routes/webhooks.ts
```

It handles:
- `INITIAL_PURCHASE` → Sets `subscription_tier = 'pro'`
- `RENEWAL` → Maintains `subscription_tier = 'pro'`
- `CANCELLATION` → Sets `subscription_tier = 'free'` at period end
- `EXPIRATION` → Sets `subscription_tier = 'free'`

## Troubleshooting

### Webhook Not Receiving Events

1. Check RevenueCat webhook logs for delivery status
2. Verify URL is publicly accessible
3. Check Authorization header matches `REVENUECAT_WEBHOOK_AUTH_KEY`
4. Check API server logs for errors

### User Tier Not Updating

1. Verify webhook payload contains `app_user_id` (Supabase user ID)
2. Check database for user record
3. Verify `subscription_tier` column exists in `user_profiles`

### Sandbox Purchases Stuck

1. Clear App Store sandbox cache on device
2. Sign out and back in to sandbox account
3. Try different sandbox tester account

## References

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [App Store Connect Subscriptions](https://developer.apple.com/documentation/storekit/in-app_purchase/original_api_for_in-app_purchase/subscriptions_and_offers)
- [Google Play Billing](https://developer.android.com/google/play/billing)
