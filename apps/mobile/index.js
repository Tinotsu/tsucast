/**
 * App Entry Point
 *
 * Registers the playback service before the app starts.
 * Story: 3-3 Player Screen & Controls
 */

// Suppress warnings FIRST, before any other imports
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated', // NativeWind bug: react-native-css-interop wraps deprecated SafeAreaView
  'React Native\'s New Architecture', // Expected: track-player doesn't support new arch yet
]);

import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './services/playbackService';
import 'expo-router/entry';

// Register the playback service for background audio
TrackPlayer.registerPlaybackService(() => PlaybackService);
