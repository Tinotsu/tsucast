/**
 * Sleep Timer Tests
 *
 * Tests for sleep timer constants and options.
 * Story: 3-6 Sleep Timer
 */

import { TIMER_OPTIONS } from '../../../hooks/useSleepTimer';

describe('sleepTimer', () => {
  describe('TIMER_OPTIONS', () => {
    it('should have 6 timer options', () => {
      expect(TIMER_OPTIONS).toHaveLength(6);
    });

    it('should have 15 minute option', () => {
      const option = TIMER_OPTIONS.find((o) => o.minutes === 15);
      expect(option).toBeDefined();
      expect(option?.label).toBe('15 min');
    });

    it('should have 30 minute option', () => {
      const option = TIMER_OPTIONS.find((o) => o.minutes === 30);
      expect(option).toBeDefined();
      expect(option?.label).toBe('30 min');
    });

    it('should have 45 minute option', () => {
      const option = TIMER_OPTIONS.find((o) => o.minutes === 45);
      expect(option).toBeDefined();
      expect(option?.label).toBe('45 min');
    });

    it('should have 1 hour option', () => {
      const option = TIMER_OPTIONS.find((o) => o.minutes === 60);
      expect(option).toBeDefined();
      expect(option?.label).toBe('1 hour');
    });

    it('should have end of article option with -1 minutes', () => {
      const option = TIMER_OPTIONS.find((o) => o.minutes === -1);
      expect(option).toBeDefined();
      expect(option?.label).toBe('End of article');
    });

    it('should have off option with 0 minutes', () => {
      const option = TIMER_OPTIONS.find((o) => o.minutes === 0);
      expect(option).toBeDefined();
      expect(option?.label).toBe('Off');
    });

    it('should have labels for all options', () => {
      TIMER_OPTIONS.forEach((option) => {
        expect(option.label).toBeTruthy();
        expect(typeof option.label).toBe('string');
      });
    });

    it('should have minutes values for all options', () => {
      TIMER_OPTIONS.forEach((option) => {
        expect(typeof option.minutes).toBe('number');
      });
    });
  });

  describe('timer calculations', () => {
    it('should convert minutes to seconds correctly', () => {
      const option15Min = TIMER_OPTIONS.find((o) => o.minutes === 15);
      expect(option15Min!.minutes * 60).toBe(900); // 15 min = 900 seconds

      const option1Hour = TIMER_OPTIONS.find((o) => o.minutes === 60);
      expect(option1Hour!.minutes * 60).toBe(3600); // 1 hour = 3600 seconds
    });
  });
});
