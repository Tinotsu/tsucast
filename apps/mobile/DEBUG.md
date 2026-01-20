# Debugging Guide for tsucast Mobile

## Quick Start

### 1. Chrome DevTools (Hermes Debugger)
The primary debugging method for React Native with Hermes.

```bash
# Start the app
npm start

# Press 'j' in the terminal to open Chrome DevTools
# This connects directly to the Hermes engine
```

**Features:**
- Full breakpoint support
- Console logging
- Network inspection
- Performance profiling

### 2. React DevTools (Component Inspector)
Inspect React component tree, props, state, and hooks.

```bash
# Install globally (one-time)
npm install -g react-devtools

# Run React DevTools
react-devtools

# Then start your app - it will auto-connect
npm start
```

**Features:**
- Component tree visualization
- Props and state inspection
- Hook debugging
- Performance profiling

### 3. Expo Dev Menu
Access debugging options directly on device.

- **iOS Simulator:** `Cmd + D`
- **Android Emulator:** `Cmd + M` (Mac) or `Ctrl + M` (Windows/Linux)
- **Physical Device:** Shake the device

**Options:**
- Toggle debugger
- Reload app
- Show performance monitor
- Open element inspector

### 4. VS Code Debugging
Debug directly in your editor with breakpoints.

1. Install "Expo Tools" extension
2. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Expo",
      "type": "reactnative",
      "request": "attach",
      "platform": "exponent"
    }
  ]
}
```

3. Start the app: `npm start`
4. Press F5 in VS Code to attach

## Console Logging

```typescript
// Basic logging
console.log('Debug info:', variable);

// Structured logging
console.log(JSON.stringify(data, null, 2));

// Group related logs
console.group('API Response');
console.log('Status:', response.status);
console.log('Data:', response.data);
console.groupEnd();

// Performance timing
console.time('operation');
// ... do work
console.timeEnd('operation');
```

## Network Debugging

### React Query DevTools (Web only)
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In your root layout (web only)
{__DEV__ && <ReactQueryDevtools initialIsOpen={false} />}
```

### Manual Network Logging
```typescript
// Add to your API client
if (__DEV__) {
  console.log('Request:', { url, method, body });
  console.log('Response:', { status, data });
}
```

## Performance Profiling

### React Native Performance Monitor
1. Open Dev Menu (shake or Cmd+D)
2. Select "Show Performance Monitor"
3. Watch FPS and memory usage

### JavaScript Profiler
1. Open Chrome DevTools (press 'j')
2. Go to "Performance" tab
3. Click Record
4. Perform actions in app
5. Stop recording and analyze

## Common Issues

### "Debugger pauses on every error"
In Chrome DevTools:
1. Go to Sources tab
2. Click the pause icon until it shows "Don't pause on exceptions"

### "Hot reload not working"
```bash
# Clear Metro cache
npx expo start --clear
```

### "Cannot connect to debugger"
1. Kill all Metro/Expo processes
2. Run `npm start -- --clear`
3. Press 'j' again

### "State not updating in DevTools"
Ensure you're using the correct version:
```bash
npm install -g react-devtools@latest
```

## Environment-Specific Debugging

```typescript
// Only run in development
if (__DEV__) {
  // Debug code here
  console.log('Development mode');
}

// Check if running in Expo Go
import Constants from 'expo-constants';
if (Constants.appOwnership === 'expo') {
  console.log('Running in Expo Go');
}
```

## Useful Debug Snippets

### Log Component Renders
```typescript
useEffect(() => {
  console.log('Component mounted/updated');
});
```

### Track State Changes
```typescript
useEffect(() => {
  console.log('State changed:', state);
}, [state]);
```

### Log Navigation Events
```typescript
import { usePathname } from 'expo-router';

const pathname = usePathname();
useEffect(() => {
  console.log('Navigated to:', pathname);
}, [pathname]);
```
