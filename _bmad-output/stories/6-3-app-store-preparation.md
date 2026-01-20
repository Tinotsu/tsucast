# Story 6.3: App Store Preparation

Status: ready-for-dev

## Story

As the app owner,
I want the app ready for App Store submission,
so that users can download it.

## Acceptance Criteria

1. **AC1: App Metadata**
   - Given app is feature-complete
   - When preparing for submission
   - Then app.json has correct metadata (name, version, bundle ID)
   - And app icons are present in all required sizes
   - And splash screen is configured

2. **AC2: iOS Build**
   - Given building for iOS
   - When EAS Build runs
   - Then production build succeeds
   - And app size is reasonable (< 50MB)

3. **AC3: Android Build**
   - Given building for Android
   - When EAS Build runs
   - Then production build succeeds
   - And app is properly signed

4. **AC4: Store Submission**
   - Given app is submitted
   - When review is pending
   - Then all required screenshots are provided
   - And privacy policy URL is configured
   - And app description is complete

## Tasks / Subtasks

### Task 1: App Configuration (AC: 1)
- [ ] 1.1 Update `app.json` with production settings:
  ```json
  {
    "expo": {
      "name": "tsucast",
      "slug": "tsucast",
      "version": "1.0.0",
      "orientation": "portrait",
      "icon": "./assets/images/icon.png",
      "scheme": "tsucast",
      "userInterfaceStyle": "automatic",
      "splash": {
        "image": "./assets/images/splash.png",
        "resizeMode": "contain",
        "backgroundColor": "#FFFBEB"
      },
      "ios": {
        "bundleIdentifier": "com.tsucast.app",
        "buildNumber": "1",
        "supportsTablet": true,
        "infoPlist": {
          "UIBackgroundModes": ["audio"],
          "NSMicrophoneUsageDescription": "Not used",
          "ITSAppUsesNonExemptEncryption": false
        },
        "usesAppleSignIn": true
      },
      "android": {
        "package": "com.tsucast.app",
        "versionCode": 1,
        "adaptiveIcon": {
          "foregroundImage": "./assets/images/adaptive-icon.png",
          "backgroundColor": "#FFFBEB"
        },
        "permissions": [
          "android.permission.FOREGROUND_SERVICE",
          "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"
        ]
      },
      "web": {
        "bundler": "metro",
        "favicon": "./assets/images/favicon.png"
      },
      "plugins": [
        "expo-router",
        "expo-secure-store",
        [
          "expo-build-properties",
          {
            "ios": {
              "deploymentTarget": "13.4"
            },
            "android": {
              "minSdkVersion": 24
            }
          }
        ]
      ],
      "extra": {
        "eas": {
          "projectId": "your-project-id"
        }
      }
    }
  }
  ```

### Task 2: App Icons (AC: 1)
- [ ] 2.1 Create app icon at 1024x1024 pixels:
  - Design with tsucast branding
  - Autumn Magic palette (amber on cream)
  - Simple, recognizable at small sizes
- [ ] 2.2 Place icon files:
  - `assets/images/icon.png` (1024x1024)
  - `assets/images/adaptive-icon.png` (Android adaptive, foreground)
  - `assets/images/favicon.png` (Web, 32x32)
- [ ] 2.3 Expo will generate all required sizes automatically

### Task 3: Splash Screen (AC: 1)
- [ ] 3.1 Create splash screen at 1284x2778 pixels:
  - tsucast logo centered
  - Cream background (#FFFBEB)
  - Clean, minimal
- [ ] 3.2 Place at `assets/images/splash.png`

### Task 4: EAS Configuration (AC: 2, 3)
- [ ] 4.1 Create/update `eas.json`:
  ```json
  {
    "cli": {
      "version": ">= 5.0.0"
    },
    "build": {
      "development": {
        "developmentClient": true,
        "distribution": "internal"
      },
      "preview": {
        "distribution": "internal"
      },
      "production": {
        "autoIncrement": true
      }
    },
    "submit": {
      "production": {
        "ios": {
          "appleId": "your-apple-id@email.com",
          "ascAppId": "your-app-store-connect-app-id",
          "appleTeamId": "your-team-id"
        },
        "android": {
          "serviceAccountKeyPath": "./google-services.json",
          "track": "production"
        }
      }
    }
  }
  ```
- [ ] 4.2 Log in to EAS:
  ```bash
  eas login
  ```
- [ ] 4.3 Configure project:
  ```bash
  eas build:configure
  ```

### Task 5: iOS Production Build (AC: 2)
- [ ] 5.1 Set up Apple Developer account credentials
- [ ] 5.2 Run production build:
  ```bash
  eas build --platform ios --profile production
  ```
- [ ] 5.3 Verify build succeeds
- [ ] 5.4 Check app size is under 50MB
- [ ] 5.5 Test on TestFlight

### Task 6: Android Production Build (AC: 3)
- [ ] 6.1 Create upload keystore (EAS can generate):
  ```bash
  eas credentials
  ```
- [ ] 6.2 Run production build:
  ```bash
  eas build --platform android --profile production
  ```
- [ ] 6.3 Verify build succeeds and is signed
- [ ] 6.4 Test APK/AAB locally

### Task 7: App Store Screenshots (AC: 4)
- [ ] 7.1 Capture screenshots for required sizes:
  - iPhone 6.7" (1290×2796) - iPhone 15 Pro Max
  - iPhone 6.5" (1284×2778) - iPhone 15 Plus
  - iPhone 5.5" (1242×2208) - iPhone 8 Plus
  - iPad Pro 12.9" (2048×2732)
- [ ] 7.2 Capture key screens:
  - Add screen (paste URL)
  - Player screen (now playing)
  - Library screen
  - Voice selection
- [ ] 7.3 Optional: Create marketing graphics with captions

### Task 8: Play Store Screenshots (AC: 4)
- [ ] 8.1 Capture screenshots:
  - Phone: 1080×1920 or similar
  - 7" tablet: 1200×1920
  - 10" tablet: 1600×2560
- [ ] 8.2 Same key screens as iOS
- [ ] 8.3 Feature graphic: 1024×500

### Task 9: Store Listings (AC: 4)
- [ ] 9.1 Write app description:
  ```
  Turn any article into a podcast with tsucast.

  Paste a URL, select a voice, and start listening in seconds. tsucast transforms articles, blog posts, and PDFs into high-quality audio you can enjoy while walking, commuting, or relaxing.

  FEATURES:
  • Instant conversion - Paste any URL and hear audio in under 10 seconds
  • Premium AI voices - Natural-sounding narration that doesn't feel robotic
  • Podcast controls - Play, pause, skip, speed control, and sleep timer
  • Background playback - Listen while your phone is locked
  • Personal library - Save and organize your audio articles
  • Cross-device sync - Start on one device, continue on another

  FREE TIER:
  • 3 articles per day
  • All voices included
  • Full playback features

  PRO ($9.99/month):
  • Unlimited articles
  • Priority processing
  • Early access to new features

  Perfect for knowledge workers, podcast lovers, and anyone with a reading list they never get to.
  ```
- [ ] 9.2 Create short description (80 chars):
  ```
  Turn any article into a podcast. Paste, listen, walk.
  ```
- [ ] 9.3 Keywords for App Store:
  ```
  podcast, text to speech, tts, article reader, read aloud, audiobook, listen
  ```

### Task 10: Privacy Policy & Support (AC: 4)
- [ ] 10.1 Create privacy policy page:
  - Host at `https://tsucast.com/privacy`
  - Cover data collection, storage, third parties
- [ ] 10.2 Create support URL:
  - Host at `https://tsucast.com/support`
  - Or use email: support@tsucast.com
- [ ] 10.3 Update app.json with URLs:
  ```json
  {
    "expo": {
      "ios": {
        "privacyManifests": {
          "NSPrivacyAccessedAPITypes": []
        }
      }
    }
  }
  ```

### Task 11: App Store Submission (AC: 4)
- [ ] 11.1 Submit iOS via EAS:
  ```bash
  eas submit --platform ios
  ```
- [ ] 11.2 Complete App Store Connect listing
- [ ] 11.3 Submit for review

### Task 12: Play Store Submission (AC: 4)
- [ ] 12.1 Submit Android via EAS:
  ```bash
  eas submit --platform android
  ```
- [ ] 12.2 Complete Play Console listing
- [ ] 12.3 Submit for review

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Expo SDK 53 with EAS Build
- No native code modifications needed
- Cloud builds (no Mac required for iOS)

**Store Requirements:**
- iOS 13.4+ minimum
- Android API 24+ (Android 7.0+)
- Privacy policy required
- Subscription terms must be clear

### Source Tree Components

```
apps/mobile/
├── app.json                 # App configuration
├── eas.json                 # EAS Build config
└── assets/images/
    ├── icon.png             # App icon (1024x1024)
    ├── adaptive-icon.png    # Android adaptive
    ├── splash.png           # Splash screen
    └── favicon.png          # Web favicon

Website:
├── privacy/                 # Privacy policy
└── support/                 # Support page
```

### Store Checklist

**App Store Connect:**
- [ ] App name and subtitle
- [ ] Primary and secondary categories (Productivity, Utilities)
- [ ] Age rating (4+)
- [ ] Screenshots for all device sizes
- [ ] App description
- [ ] Keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Subscription details
- [ ] Review notes (test account)

**Google Play Console:**
- [ ] App name and short description
- [ ] Full description
- [ ] Screenshots and feature graphic
- [ ] App category (Productivity)
- [ ] Content rating questionnaire
- [ ] Privacy policy URL
- [ ] Subscription products configured
- [ ] Target audience and content

### Testing Standards

- Test production build on real devices
- Verify in-app purchases work in sandbox
- Check all deep links work
- Verify background audio on both platforms
- Test app size is acceptable

### Key Technical Decisions

1. **EAS Build:** Cloud builds, no local setup needed
2. **Auto Increment:** Build numbers auto-increment
3. **TestFlight/Internal Testing:** Beta test before submission
4. **Privacy Manifest:** iOS 17+ requirement

### Dependencies

- All features must be complete and tested
- RevenueCat products configured
- Privacy policy and support pages created

### References

- [Source: architecture-v2.md#Deployment]
- [Source: epics.md#Story-6.3-App-Store-Preparation]
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
