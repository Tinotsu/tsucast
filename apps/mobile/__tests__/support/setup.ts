/**
 * Jest Setup File
 *
 * This file runs before each test file.
 * Add global mocks and test utilities here.
 */

// Note: expo-crypto is mocked via manual mock in __mocks__/expo-crypto.ts

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn().mockResolvedValue(''),
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock react-native-track-player
jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn().mockResolvedValue(true),
    updateOptions: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    seekTo: jest.fn().mockResolvedValue(undefined),
    setRate: jest.fn().mockResolvedValue(undefined),
    setVolume: jest.fn().mockResolvedValue(undefined),
    getVolume: jest.fn().mockResolvedValue(1),
    getPosition: jest.fn().mockResolvedValue(0),
    getDuration: jest.fn().mockResolvedValue(0),
    getPlaybackState: jest.fn().mockResolvedValue({ state: 'paused' }),
    getActiveTrack: jest.fn().mockResolvedValue(null),
    addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    setRepeatMode: jest.fn().mockResolvedValue(undefined),
    registerPlaybackService: jest.fn(),
  },
  Event: {
    PlaybackState: 'playback-state',
    PlaybackError: 'playback-error',
    PlaybackQueueEnded: 'playback-queue-ended',
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteSeek: 'remote-seek',
    RemoteJumpForward: 'remote-jump-forward',
    RemoteJumpBackward: 'remote-jump-backward',
    RemoteDuck: 'remote-duck',
  },
  State: {
    None: 'none',
    Ready: 'ready',
    Playing: 'playing',
    Paused: 'paused',
    Stopped: 'stopped',
    Buffering: 'buffering',
    Loading: 'loading',
  },
  Capability: {
    Play: 'play',
    Pause: 'pause',
    Stop: 'stop',
    SeekTo: 'seek-to',
    JumpForward: 'jump-forward',
    JumpBackward: 'jump-backward',
    SkipToNext: 'skip-to-next',
    SkipToPrevious: 'skip-to-previous',
  },
  RepeatMode: {
    Off: 0,
    Track: 1,
    Queue: 2,
  },
  AppKilledPlaybackBehavior: {
    ContinuePlayback: 'continue-playback',
    PausePlayback: 'pause-playback',
    StopPlaybackAndRemoveNotification: 'stop',
  },
  usePlaybackState: jest.fn().mockReturnValue({ state: 'paused' }),
  useProgress: jest.fn().mockReturnValue({ position: 0, duration: 0, buffered: 0 }),
  useActiveTrack: jest.fn().mockReturnValue(null),
}));

// Silence console.error and console.warn in tests (optional - enable for cleaner output)
// global.console.error = jest.fn();
// global.console.warn = jest.fn();

// Global test utilities
(global as typeof globalThis & { __DEV__: boolean }).__DEV__ = true;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
