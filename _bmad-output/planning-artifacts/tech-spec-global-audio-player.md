# Tech Spec: Global Persistent Audio Player

**Date:** 2026-01-29
**Author:** Sally (UX Designer) + Technical Analysis
**Status:** Draft

---

## Problem Statement

The current `WebPlayer` component creates a local `<audio>` element that:
- Stops when navigating between pages (component unmounts)
- Cannot be controlled from other pages
- Has no mini-player persistence
- Doesn't integrate with browser Media Session API

**Goal:** Implement an Apple Podcasts-style global player that persists across the entire website and can be controlled from any page.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Root Layout                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Providers                              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              AudioPlayerProvider                     │  │  │
│  │  │  ┌─────────────────────────────────────────────┐    │  │  │
│  │  │  │         AudioService (singleton)            │    │  │  │
│  │  │  │  - HTMLAudioElement (persists)              │    │  │  │
│  │  │  │  - Media Session API                        │    │  │  │
│  │  │  │  - State (track, position, playing)         │    │  │  │
│  │  │  └─────────────────────────────────────────────┘    │  │  │
│  │  │                                                      │  │  │
│  │  │  {children} ← All pages                             │  │  │
│  │  │                                                      │  │  │
│  │  │  ┌─────────────────────────────────────────────┐    │  │  │
│  │  │  │         MiniPlayer (always visible)         │    │  │  │
│  │  │  └─────────────────────────────────────────────┘    │  │  │
│  │  │                                                      │  │  │
│  │  │  ┌─────────────────────────────────────────────┐    │  │  │
│  │  │  │       PlayerModal (portal to body)          │    │  │  │
│  │  │  └─────────────────────────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. AudioService (Singleton Class)

A singleton class that manages the actual audio playback, separate from React.

```typescript
// lib/audio-service.ts

interface Track {
  id: string;
  audioUrl: string;
  title: string;
  source?: string;
  duration?: number;
  artworkUrl?: string;
}

interface AudioState {
  track: Track | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  error: Error | null;
}

type AudioEventCallback = (state: AudioState) => void;

class AudioService {
  private static instance: AudioService;
  private audio: HTMLAudioElement;
  private state: AudioState;
  private listeners: Set<AudioEventCallback>;

  private constructor() {
    // Create persistent audio element
    this.audio = new Audio();
    this.audio.preload = 'metadata';

    // Initialize state
    this.state = {
      track: null,
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1,
      volume: 1,
      isMuted: false,
      error: null,
    };

    this.listeners = new Set();
    this.setupEventListeners();
    this.setupMediaSession();
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  // Methods: play, pause, seek, setTrack, skip, setPlaybackRate, etc.
  // Event handling: subscribe, unsubscribe
  // Media Session: setupMediaSession, updateMediaSession
}

export const audioService = AudioService.getInstance();
```

**Key Points:**
- Singleton ensures only ONE audio element exists
- Audio element is created ONCE and never destroyed
- State is managed internally, React subscribes to changes
- Works even without React (can be used on landing page)

---

### 2. AudioPlayerProvider (React Context)

Wraps the app and provides audio state + controls to all components.

```typescript
// providers/AudioPlayerProvider.tsx

interface AudioPlayerContextValue {
  // State
  state: AudioState;

  // Track control
  playTrack: (track: Track) => Promise<void>;

  // Playback control
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  skipForward: (seconds?: number) => void;
  skipBack: (seconds?: number) => void;

  // Settings
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  // UI control
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AudioState>(audioService.getState());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Subscribe to audio service state changes
    const unsubscribe = audioService.subscribe(setState);
    return unsubscribe;
  }, []);

  const value: AudioPlayerContextValue = {
    state,
    playTrack: audioService.setTrack.bind(audioService),
    play: audioService.play.bind(audioService),
    pause: audioService.pause.bind(audioService),
    // ... etc
    isModalOpen,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      {state.track && <MiniPlayer />}
      {isModalOpen && <PlayerModal />}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
}
```

---

### 3. MiniPlayer Component

Persistent bar at the bottom of the screen.

```typescript
// components/player/MiniPlayer.tsx

export function MiniPlayer() {
  const { state, togglePlayPause, openModal } = useAudioPlayer();

  if (!state.track) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-surface border-t"
      onClick={openModal}
    >
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-secondary">
        <div
          className="h-full bg-accent"
          style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
        />
      </div>

      <div className="flex items-center h-full px-4">
        {/* Thumbnail */}
        <div className="w-10 h-10 bg-secondary rounded" />

        {/* Title */}
        <div className="flex-1 ml-3 truncate">
          <p className="font-bold text-sm truncate">{state.track.title}</p>
          <p className="text-xs text-secondary">{formatTime(state.currentTime)}</p>
        </div>

        {/* Play/Pause */}
        <button
          onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
          className="w-10 h-10 flex items-center justify-center"
        >
          {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Skip */}
        <button className="w-10 h-10">
          <SkipIcon />
        </button>
      </div>
    </div>
  );
}
```

---

### 4. PlayerModal Component

Full-screen player overlay.

```typescript
// components/player/PlayerModal.tsx

export function PlayerModal() {
  const { state, closeModal, ...controls } = useAudioPlayer();

  if (!state.track) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-background">
      {/* Close button */}
      <button onClick={closeModal} className="absolute top-4 right-4">
        <CloseIcon />
      </button>

      {/* Artwork */}
      <div className="w-72 h-72 mx-auto mt-20 bg-surface rounded-xl" />

      {/* Title & Source */}
      <h1 className="text-center text-xl font-bold mt-8">{state.track.title}</h1>
      <p className="text-center text-secondary">{state.track.source}</p>

      {/* Progress bar */}
      <Slider
        value={state.currentTime}
        max={state.duration}
        onChange={controls.seek}
      />

      {/* Transport controls */}
      <div className="flex justify-center items-center gap-8 mt-8">
        <button onClick={() => controls.skipBack(15)}>-15</button>
        <button onClick={controls.togglePlayPause} className="w-16 h-16">
          {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button onClick={() => controls.skipForward(15)}>+15</button>
      </div>

      {/* Extras */}
      <div className="flex justify-center gap-8 mt-8">
        <SpeedControl />
        <SleepTimer />
        <QueueButton />
      </div>
    </div>,
    document.body
  );
}
```

---

### 5. EmbeddablePlayer (Landing Page)

A standalone player that doesn't require the full app context.

```typescript
// components/player/EmbeddablePlayer.tsx

interface EmbeddablePlayerProps {
  audioUrl: string;
  title: string;
  duration?: number;
  showExpandButton?: boolean;
}

export function EmbeddablePlayer({ audioUrl, title, duration, showExpandButton }: EmbeddablePlayerProps) {
  // Uses the same audioService singleton
  // But doesn't require AudioPlayerProvider

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime);
    });
    return unsubscribe;
  }, []);

  const handlePlay = () => {
    audioService.setTrack({ id: audioUrl, audioUrl, title, duration });
    audioService.play();
  };

  return (
    <div className="rounded-xl bg-surface p-4">
      {/* Compact inline player */}
      <div className="flex items-center gap-3">
        <button onClick={handlePlay}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="flex-1">
          <p className="font-bold text-sm">{title}</p>
          <div className="h-1 bg-secondary mt-2">
            <div
              className="h-full bg-accent"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {showExpandButton && (
        <a href="/app" className="text-sm text-accent">
          Open in app →
        </a>
      )}
    </div>
  );
}
```

---

## Media Session API Integration

For browser media controls (notification, lock screen on mobile browsers).

```typescript
// Inside AudioService

private setupMediaSession() {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.setActionHandler('play', () => this.play());
  navigator.mediaSession.setActionHandler('pause', () => this.pause());
  navigator.mediaSession.setActionHandler('seekbackward', () => this.skipBack(15));
  navigator.mediaSession.setActionHandler('seekforward', () => this.skipForward(15));
  navigator.mediaSession.setActionHandler('previoustrack', null);
  navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
}

private updateMediaSession() {
  if (!('mediaSession' in navigator) || !this.state.track) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: this.state.track.title,
    artist: 'tsucast',
    album: this.state.track.source || 'Article',
    artwork: [
      { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ]
  });

  navigator.mediaSession.playbackState = this.state.isPlaying ? 'playing' : 'paused';
}
```

---

## State Persistence

### Local Storage for User Preferences

```typescript
// Persisted to localStorage
interface PlayerPreferences {
  playbackRate: number;
  volume: number;
  lastTrackId: string | null;
  lastPosition: number;
}

// On page load, restore from localStorage
// On changes, save to localStorage
```

### Server-Side Position Sync

```typescript
// Debounced API call to save position
const savePosition = debounce(async (trackId: string, position: number) => {
  await fetch(`/api/library/${trackId}/position`, {
    method: 'PATCH',
    body: JSON.stringify({ position }),
  });
}, 5000); // Save every 5 seconds max
```

---

## Integration with Existing Code

### Update Providers.tsx

```typescript
// components/Providers.tsx

import { AudioPlayerProvider } from '@/providers/AudioPlayerProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  // ... existing code

  return (
    <QueryClientProvider client={queryClient}>
      <AudioPlayerProvider>
        {/* ... existing providers */}
        {children}
      </AudioPlayerProvider>
    </QueryClientProvider>
  );
}
```

### Update Root Layout

```typescript
// app/layout.tsx

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          {/* MiniPlayer and PlayerModal are rendered inside AudioPlayerProvider */}
        </Providers>
      </body>
    </html>
  );
}
```

### Usage in Library Page

```typescript
// app/(app)/library/page.tsx

function LibraryItem({ item }: { item: LibraryItem }) {
  const { playTrack, state } = useAudioPlayer();

  const isCurrentTrack = state.track?.id === item.audio_id;
  const isPlaying = isCurrentTrack && state.isPlaying;

  const handlePlay = () => {
    playTrack({
      id: item.audio_id,
      audioUrl: item.audio_url,
      title: item.title,
      duration: item.duration,
    });
  };

  return (
    <div onClick={handlePlay}>
      {/* ... */}
      <PlayButton isPlaying={isPlaying} />
    </div>
  );
}
```

### Usage on Landing Page (No Auth)

```typescript
// app/page.tsx (Landing)

import { EmbeddablePlayer } from '@/components/player/EmbeddablePlayer';

export default function LandingPage() {
  const demoTrack = {
    audioUrl: 'https://example.com/demo.mp3',
    title: 'Try it now: How AI is Changing Work',
    duration: 180,
  };

  return (
    <div>
      {/* Hero section */}
      <h1>tsucast</h1>

      {/* Demo player */}
      <EmbeddablePlayer
        {...demoTrack}
        showExpandButton={true}
      />
    </div>
  );
}
```

---

## File Structure

```
apps/web/
├── lib/
│   └── audio-service.ts          # Singleton audio service
│
├── providers/
│   └── AudioPlayerProvider.tsx   # React context provider
│
├── hooks/
│   └── useAudioPlayer.ts         # Hook to access player (re-export)
│
├── components/
│   └── player/
│       ├── MiniPlayer.tsx        # Persistent bottom bar
│       ├── PlayerModal.tsx       # Full-screen modal
│       ├── EmbeddablePlayer.tsx  # Standalone for landing
│       ├── ProgressBar.tsx       # Seekable progress
│       ├── SpeedControl.tsx      # Speed selector
│       ├── SleepTimer.tsx        # Sleep timer UI
│       └── VolumeControl.tsx     # Volume slider
│
└── app/
    └── layout.tsx                # Updated with AudioPlayerProvider
```

---

## Implementation Phases

### Phase 1: Core Audio Service
1. Create `AudioService` singleton class
2. Implement basic play/pause/seek/skip
3. Add event subscription system
4. Add Media Session API support

### Phase 2: React Integration
1. Create `AudioPlayerProvider` context
2. Create `useAudioPlayer` hook
3. Integrate into `Providers.tsx`

### Phase 3: Player UI Components
1. Build `MiniPlayer` component
2. Build `PlayerModal` component
3. Add progress bar, volume, speed controls
4. Add sleep timer functionality

### Phase 4: Landing Page Integration
1. Create `EmbeddablePlayer` component
2. Test on landing page without auth
3. Ensure free content plays correctly

### Phase 5: Polish
1. Add animations/transitions
2. Keyboard shortcuts (space = play/pause)
3. Position persistence (localStorage + API)
4. Error handling and retry logic

---

## Browser Compatibility Notes

| Feature | Chrome | Safari | Firefox | Mobile Safari |
|---------|--------|--------|---------|---------------|
| Audio playback | ✅ | ✅ | ✅ | ✅ |
| Media Session | ✅ | ⚠️ Partial | ✅ | ⚠️ Partial |
| Background audio | ✅ | ⚠️ Tab must be visible | ✅ | ❌ Limited |
| Lock screen controls | ✅ | ❌ | ✅ | ⚠️ PWA only |

**Note:** Web audio has limitations on mobile. Always encourage users to download the native app for best experience.

---

## Testing Checklist

- [ ] Audio continues playing during page navigation
- [ ] Mini-player visible on all pages when track loaded
- [ ] Modal opens/closes correctly
- [ ] Playback state syncs between mini-player and modal
- [ ] Position saves to server correctly (debounced)
- [ ] Speed persists across sessions
- [ ] Media Session shows in browser/OS media controls
- [ ] Works on landing page without auth
- [ ] Free content plays without login
- [ ] Error handling for network failures
- [ ] Handles audio element errors gracefully

---

## Dependencies

**Required:**
- None (uses native HTML5 Audio API)

**Optional/Recommended:**
- `@radix-ui/react-slider` - For accessible progress/volume sliders
- `@radix-ui/react-dialog` - For accessible modal
- `zustand` - Alternative to React Context (lighter, no re-render issues)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Audio stops on tab sleep (Safari) | Show banner encouraging mobile app |
| Media Session not supported | Gracefully degrade, controls still work in-app |
| Position sync race conditions | Debounce saves, use optimistic updates |
| Memory leaks from event listeners | Proper cleanup in useEffect |
| SSR issues with Audio API | Check for `window` before accessing |

---

## Success Metrics

1. **Persistence:** Audio continues for 100% of same-origin navigations
2. **Performance:** < 50ms latency when starting playback
3. **Position accuracy:** Position restored within 1 second of last save
4. **Crash recovery:** Last track/position restored on page refresh
