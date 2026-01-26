/**
 * Format Utilities Tests
 *
 * Tests for utils/format.ts - Duration, date, and time formatting
 * Priority: P2 (Medium - utility functions)
 */

import { formatDuration, formatRelativeDate, formatTime } from '../../../utils/format';

describe('formatDuration', () => {
  describe('[P2] basic formatting', () => {
    it('should format 0 seconds as "0 min"', () => {
      expect(formatDuration(0)).toBe('0 min');
    });

    it('should format null as "0 min"', () => {
      expect(formatDuration(null)).toBe('0 min');
    });

    it('should format undefined as "0 min"', () => {
      expect(formatDuration(undefined)).toBe('0 min');
    });
  });

  describe('[P2] minutes formatting', () => {
    it('should format 60 seconds as "1 min"', () => {
      expect(formatDuration(60)).toBe('1 min');
    });

    it('should format 300 seconds as "5 min"', () => {
      expect(formatDuration(300)).toBe('5 min');
    });

    it('should format 3540 seconds as "59 min"', () => {
      expect(formatDuration(3540)).toBe('59 min');
    });

    it('should round down partial minutes', () => {
      // 90 seconds = 1.5 min, should show as 1 min
      expect(formatDuration(90)).toBe('1 min');
    });
  });

  describe('[P2] hours formatting', () => {
    it('should format 3600 seconds as "1h 0m"', () => {
      expect(formatDuration(3600)).toBe('1h 0m');
    });

    it('should format 5400 seconds as "1h 30m"', () => {
      expect(formatDuration(5400)).toBe('1h 30m');
    });

    it('should format 7200 seconds as "2h 0m"', () => {
      expect(formatDuration(7200)).toBe('2h 0m');
    });

    it('should format long durations correctly', () => {
      // 3 hours 45 minutes = 13500 seconds
      expect(formatDuration(13500)).toBe('3h 45m');
    });
  });

  describe('[P2] edge cases', () => {
    it('should handle very small values', () => {
      expect(formatDuration(30)).toBe('0 min');
    });

    it('should handle very large values', () => {
      // 24 hours = 86400 seconds
      expect(formatDuration(86400)).toBe('24h 0m');
    });
  });
});

describe('formatRelativeDate', () => {
  // Use fixed dates for deterministic tests
  const NOW = new Date('2024-06-15T12:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('[P2] today and yesterday', () => {
    it('should format same day as "Today"', () => {
      const today = '2024-06-15T08:00:00Z';
      expect(formatRelativeDate(today)).toBe('Today');
    });

    it('should format yesterday as "Yesterday"', () => {
      const yesterday = '2024-06-14T12:00:00Z';
      expect(formatRelativeDate(yesterday)).toBe('Yesterday');
    });
  });

  describe('[P2] recent days', () => {
    it('should format 2 days ago correctly', () => {
      const twoDaysAgo = '2024-06-13T12:00:00Z';
      expect(formatRelativeDate(twoDaysAgo)).toBe('2 days ago');
    });

    it('should format 6 days ago correctly', () => {
      const sixDaysAgo = '2024-06-09T12:00:00Z';
      expect(formatRelativeDate(sixDaysAgo)).toBe('6 days ago');
    });
  });

  describe('[P2] older dates', () => {
    it('should format dates older than 7 days with full date', () => {
      const oldDate = '2024-06-01T12:00:00Z';
      const result = formatRelativeDate(oldDate);
      // Should be a locale date string, not "X days ago"
      expect(result).not.toContain('days ago');
    });

    it('should format very old dates with full date', () => {
      const veryOld = '2023-01-01T12:00:00Z';
      const result = formatRelativeDate(veryOld);
      expect(result).not.toContain('days ago');
    });
  });
});

describe('formatTime', () => {
  describe('[P2] seconds only (under 1 minute)', () => {
    it('should format 0 seconds as "0:00"', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    it('should format 5 seconds as "0:05"', () => {
      expect(formatTime(5)).toBe('0:05');
    });

    it('should format 30 seconds as "0:30"', () => {
      expect(formatTime(30)).toBe('0:30');
    });

    it('should format 59 seconds as "0:59"', () => {
      expect(formatTime(59)).toBe('0:59');
    });
  });

  describe('[P2] minutes and seconds', () => {
    it('should format 60 seconds as "1:00"', () => {
      expect(formatTime(60)).toBe('1:00');
    });

    it('should format 90 seconds as "1:30"', () => {
      expect(formatTime(90)).toBe('1:30');
    });

    it('should format 330 seconds as "5:30"', () => {
      expect(formatTime(330)).toBe('5:30');
    });

    it('should format 3599 seconds as "59:59"', () => {
      expect(formatTime(3599)).toBe('59:59');
    });
  });

  describe('[P2] hours, minutes, and seconds', () => {
    it('should format 3600 seconds as "1:00:00"', () => {
      expect(formatTime(3600)).toBe('1:00:00');
    });

    it('should format 3661 seconds as "1:01:01"', () => {
      expect(formatTime(3661)).toBe('1:01:01');
    });

    it('should format 5400 seconds as "1:30:00"', () => {
      expect(formatTime(5400)).toBe('1:30:00');
    });

    it('should format 7323 seconds as "2:02:03"', () => {
      expect(formatTime(7323)).toBe('2:02:03');
    });

    it('should pad minutes and seconds with leading zeros', () => {
      // 1 hour, 5 minutes, 5 seconds = 3905 seconds
      expect(formatTime(3905)).toBe('1:05:05');
    });
  });

  describe('[P2] edge cases', () => {
    it('should handle decimal seconds by flooring', () => {
      expect(formatTime(90.7)).toBe('1:30');
    });

    it('should handle very long durations', () => {
      // 10 hours = 36000 seconds
      expect(formatTime(36000)).toBe('10:00:00');
    });
  });
});

describe('Format Utilities Integration', () => {
  describe('[P2] consistent formatting across functions', () => {
    it('should format same duration consistently', () => {
      const seconds = 5400; // 1.5 hours

      // formatDuration: human readable for display
      expect(formatDuration(seconds)).toBe('1h 30m');

      // formatTime: precise for player controls
      expect(formatTime(seconds)).toBe('1:30:00');
    });

    it('should handle podcast-length content', () => {
      const podcastLength = 45 * 60; // 45 minutes

      expect(formatDuration(podcastLength)).toBe('45 min');
      expect(formatTime(podcastLength)).toBe('45:00');
    });

    it('should handle article-length content', () => {
      const articleLength = 8 * 60; // 8 minutes

      expect(formatDuration(articleLength)).toBe('8 min');
      expect(formatTime(articleLength)).toBe('8:00');
    });
  });
});
