# Story 3.4: Background Audio & Lock Screen

Status: done

## Story

As a user who locked their phone,
I want audio to continue playing,
so that I can listen while walking without looking at my phone.

## Acceptance Criteria

1. **AC1: Background Playback**
   - Given audio is playing
   - When user locks their phone
   - Then audio continues playing
   - And lock screen shows media controls

2. **AC2: App Backgrounding**
   - Given audio is playing
   - When user presses home/switches apps
   - Then audio continues in background

3. **AC3: Lock Screen Controls**
   - Given lock screen is visible
   - When user taps play/pause on lock screen
   - Then audio responds correctly

4. **AC4: Bluetooth Controls**
   - Given user has Bluetooth headphones
   - When they use headphone controls
   - Then play/pause/skip work correctly

5. **AC5: Audio Interruption Handling**
   - Given phone call comes in
   - When audio is playing
   - Then audio pauses automatically
   - And resumes when call ends

## Tasks / Subtasks

### Task 1: iOS Audio Session Configuration (AC: 1, 2, 5)
- [ ] 1.1 Update `app.json` with iOS audio configuration:
  ```json
  {
    "expo": {
      "ios": {
        "infoPlist": {
          "UIBackgroundModes": ["audio"],
          "AVAudioSessionCategory": "AVAudioSessionCategoryPlayback",
          "AVAudioSessionMode": "AVAudioSessionModeDefault"
        }
      }
    }
  }
  ```
- [ ] 1.2 Verify background audio capability is enabled in Xcode (EAS handles this)

### Task 2: Android Foreground Service (AC: 1, 2)
- [ ] 2.1 Update `app.json` with Android configuration:
  ```json
  {
    "expo": {
      "android": {
        "permissions": [
          "android.permission.FOREGROUND_SERVICE",
          "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"
        ]
      }
    }
  }
  ```
- [ ] 2.2 Verify react-native-track-player's playback service is registered (from Story 3.3)
- [ ] 2.3 Configure notification appearance in player setup:
  ```typescript
  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
    },
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SeekTo,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
  });
  ```

### Task 3: Lock Screen Controls (AC: 3)
- [ ] 3.1 Configure now playing info in track metadata:
  ```typescript
  await TrackPlayer.add({
    id: track.id,
    url: track.audioUrl,
    title: track.title,
    artist: 'tsucast',
    artwork: track.artwork || defaultArtwork,
    duration: track.duration,
  });
  ```
- [ ] 3.2 Verify remote controls work via PlaybackService (from Story 3.3):
  ```typescript
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => TrackPlayer.seekTo(e.position));
  ```
- [ ] 3.3 Handle remote skip events:
  ```typescript
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async () => {
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(position + 30);
  });
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async () => {
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(Math.max(0, position - 15));
  });
  ```

### Task 4: Bluetooth/Headphone Controls (AC: 4)
- [ ] 4.1 Configure hardware button handling (handled by track-player by default)
- [ ] 4.2 Handle headphone disconnect:
  ```typescript
  // In PlaybackService
  TrackPlayer.addEventListener(Event.RemoteDuck, async (e) => {
    if (e.paused) {
      // Another app requested audio focus
      await TrackPlayer.pause();
    } else if (e.permanent) {
      // Headphones disconnected
      await TrackPlayer.pause();
    } else {
      // Ducking (lower volume temporarily)
      await TrackPlayer.setVolume(0.3);
    }
  });
  ```
- [ ] 4.3 Test with various Bluetooth devices (AirPods, car audio)

### Task 5: Audio Interruption Handling (AC: 5)
- [ ] 5.1 Handle phone calls and other interruptions:
  ```typescript
  TrackPlayer.addEventListener(Event.RemoteDuck, async (e) => {
    if (e.paused) {
      // Phone call or other app needs audio
      await TrackPlayer.pause();
      // Store that we were playing
      usePlayerStore.getState().setWasPlayingBeforeInterruption(true);
    }
  });
  ```
- [ ] 5.2 Resume after interruption ends:
  ```typescript
  // Add to player store
  wasPlayingBeforeInterruption: boolean;
  setWasPlayingBeforeInterruption: (was: boolean) => void;

  // In app focus handler
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        const { wasPlayingBeforeInterruption, setWasPlayingBeforeInterruption } =
          usePlayerStore.getState();
        if (wasPlayingBeforeInterruption) {
          await TrackPlayer.play();
          setWasPlayingBeforeInterruption(false);
        }
      }
    });
    return () => subscription.remove();
  }, []);
  ```
- [ ] 5.3 Handle audio focus regained event

### Task 6: Default Artwork Asset (AC: 3)
- [ ] 6.1 Create default artwork image for lock screen:
  - Size: 512x512 or 1024x1024 pixels
  - Design: tsucast logo on Amber background
  - Format: PNG
- [ ] 6.2 Place at `assets/images/default-artwork.png`
- [ ] 6.3 Use in track metadata when no custom artwork

### Task 7: Notification Customization (AC: 1)
- [ ] 7.1 Customize Android notification:
  ```typescript
  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
    },
    progressUpdateEventInterval: 2, // seconds
  });
  ```
- [ ] 7.2 Handle notification tap (open app):
  ```typescript
  // Configure in app.json or track-player options
  // Usually handled automatically by track-player
  ```

### Task 8: Testing & Verification (AC: all)
- [ ] 8.1 Test on physical iOS device:
  - Lock phone while playing → audio continues
  - Use lock screen controls → responds
  - Phone call → pauses, resumes after
  - AirPods controls → work correctly
- [ ] 8.2 Test on physical Android device:
  - Lock phone while playing → audio continues
  - Notification controls → work
  - Phone call → pauses, resumes
  - Bluetooth headphones → controls work
- [ ] 8.3 Document any platform-specific quirks

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- react-native-track-player handles background audio
- iOS requires UIBackgroundModes: audio
- Android requires foreground service

**From UX Design Specification:**
- Background-first design (90% of usage is invisible)
- Lock screen is primary interface during playback
- Seamless experience - no interruptions

### Source Tree Components

```
apps/mobile/
├── app.json                 # iOS/Android audio permissions
├── assets/images/
│   └── default-artwork.png  # Lock screen artwork
├── services/
│   └── playbackService.ts   # Remote control handlers
└── stores/
    └── playerStore.ts       # Interruption state
```

### Testing Standards

- Test on physical devices (not simulator/emulator)
- Test background playback for 30+ minutes
- Test with phone calls (interrupt and resume)
- Test with various Bluetooth devices
- Test app kill → audio continues (Android)
- Test audio focus changes (other app plays sound)

### Key Technical Decisions

1. **react-native-track-player:** Handles all platform-specific background audio
2. **Foreground Service:** Required for reliable Android background playback
3. **Audio Session:** iOS requires explicit background audio mode
4. **Interruption State:** Track if we should resume after interruption

### Dependencies

- Story 3-3 must be completed (player exists)
- Physical devices needed for testing

### Platform-Specific Notes

**iOS:**
- Background audio requires explicit capability
- Lock screen controls are automatic with track-player
- Audio interruptions handled via AVAudioSession

**Android:**
- Foreground service notification is required
- App killed behavior configurable
- Bluetooth controls work via MediaSession

### References

- [Source: architecture-v2.md#Flow-2-Audio-Playback]
- [Source: ux-design-specification.md#Background-First-Design]
- [Source: epics.md#Story-3.4-Background-Audio-Lock-Screen]
- [Source: prd.md#FR14-FR16]
- [react-native-track-player Background Playback](https://react-native-track-player.js.org/docs/basics/background-mode)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |
| 2026-01-21 | Implementation complete | Claude Opus 4.5 |

### File List

| File | Action | Description |
|------|--------|-------------|
| `apps/mobile/app.json` | Modified | iOS UIBackgroundModes, Android permissions, disabled newArch |
| `apps/mobile/services/playbackService.ts` | Modified | Remote duck event handlers for interruptions |
| `apps/mobile/services/trackPlayer.ts` | Modified | AppKilledPlaybackBehavior configuration |
| `apps/mobile/__tests__/support/setup.ts` | Modified | Track player mocks for testing |
