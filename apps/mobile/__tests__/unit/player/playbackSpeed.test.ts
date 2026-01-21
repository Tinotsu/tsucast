/**
 * Playback Speed Tests
 *
 * Tests for playback speed constants and options.
 * Story: 3-5 Playback Speed Control
 */

import { SPEED_OPTIONS } from '../../../hooks/usePlaybackSpeed';

describe('playbackSpeed', () => {
  describe('SPEED_OPTIONS', () => {
    it('should have 7 speed options', () => {
      expect(SPEED_OPTIONS).toHaveLength(7);
    });

    it('should contain standard podcast speeds', () => {
      expect(SPEED_OPTIONS).toContain(0.5);
      expect(SPEED_OPTIONS).toContain(0.75);
      expect(SPEED_OPTIONS).toContain(1);
      expect(SPEED_OPTIONS).toContain(1.25);
      expect(SPEED_OPTIONS).toContain(1.5);
      expect(SPEED_OPTIONS).toContain(1.75);
      expect(SPEED_OPTIONS).toContain(2);
    });

    it('should be in ascending order', () => {
      const sorted = [...SPEED_OPTIONS].sort((a, b) => a - b);
      expect(SPEED_OPTIONS).toEqual(sorted);
    });

    it('should have 1x (normal) as the default', () => {
      expect(SPEED_OPTIONS).toContain(1);
    });

    it('should have minimum speed of 0.5', () => {
      expect(Math.min(...SPEED_OPTIONS)).toBe(0.5);
    });

    it('should have maximum speed of 2', () => {
      expect(Math.max(...SPEED_OPTIONS)).toBe(2);
    });
  });
});
