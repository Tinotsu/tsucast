# Claude Code Instructions for tsucast

> These instructions are loaded every session. Follow them without exception.

## CRITICAL: Run App Before and After EVERY Task

**No exceptions. This is mandatory for ALL work.**

### Before starting ANY task:
```bash
npm run mobile
```
1. Wait for bundle to complete
2. Read ALL console warnings
3. **If ANY deprecation warnings appear → STOP and fix them FIRST**
4. Only proceed when console shows zero warnings

### After completing ANY task:
```bash
npm run mobile
```
1. Verify no new warnings introduced
2. Test that changes work correctly
3. Fix any issues before marking task complete

## Why This Matters

- Unit tests DO NOT catch runtime deprecation warnings
- `npm outdated` does NOT catch deprecated APIs/imports
- The ONLY way to find deprecations is to run the app
- Unfixed deprecations break production builds

## Common Deprecations to Fix Immediately

| Warning | Fix |
|---------|-----|
| `SafeAreaView has been deprecated` | Import from `react-native-safe-area-context` instead of `react-native` |
| Deprecated prop warnings | Check React Native / Expo upgrade guides |
| Native module warnings | May require dev build instead of Expo Go |

## Task Checklist

For EVERY task, you MUST:

- [ ] Run `npm run mobile` FIRST
- [ ] Fix any deprecation warnings before proceeding
- [ ] Complete the requested work
- [ ] Run `npm run mobile` AGAIN
- [ ] Verify zero warnings
- [ ] Run tests (`npm run test:mobile`, `npm run test:api`)
- [ ] Run typecheck (`npm run typecheck`)

## Do NOT

- Skip running the app "to save time"
- Trust that previous work fixed all issues
- Only run unit tests without running the app
- Mark a task complete without verifying in the running app

## References

- See `project-context.md` for full project rules
- See `_bmad-output/stories/` for current sprint work
