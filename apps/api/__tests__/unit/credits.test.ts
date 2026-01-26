/**
 * Unit Tests: Credit Calculation Service
 *
 * Story: 10-1 Web Article Credit Pricing
 * Tests the core credit calculation logic including time bank.
 */

import { describe, it, expect } from "vitest";
import { calculateCreditsNeeded, estimateDurationFromWords } from "../../src/services/credits.js";

describe("Credit Calculation Service", () => {
  describe("calculateCreditsNeeded", () => {
    describe("Basic Credit Calculation", () => {
      it("[P1] should return 1 credit for exactly 20 minutes", () => {
        // GIVEN: 20 minute article, no time bank
        const durationMinutes = 20;
        const currentTimeBank = 0;

        // WHEN: Calculating credits needed
        const result = calculateCreditsNeeded(durationMinutes, currentTimeBank);

        // THEN: Returns 1 credit, 0 time bank
        expect(result.creditsNeeded).toBe(1);
        expect(result.newTimeBank).toBe(0);
        expect(result.effectiveDuration).toBe(20);
      });

      it("[P1] should return 1 credit for 5 minutes with 15 min banked", () => {
        // GIVEN: 5 minute article, no time bank
        const durationMinutes = 5;
        const currentTimeBank = 0;

        // WHEN: Calculating credits needed
        const result = calculateCreditsNeeded(durationMinutes, currentTimeBank);

        // THEN: Returns 1 credit (20 min), 15 min banked (20 - 5 = 15)
        expect(result.creditsNeeded).toBe(1);
        expect(result.newTimeBank).toBe(15);
        expect(result.effectiveDuration).toBe(5);
      });

      it("[P1] should return 2 credits for 35 minutes with 5 min banked", () => {
        // GIVEN: 35 minute article, no time bank
        const durationMinutes = 35;
        const currentTimeBank = 0;

        // WHEN: Calculating credits needed
        const result = calculateCreditsNeeded(durationMinutes, currentTimeBank);

        // THEN: Returns 2 credits (40 min), 5 min banked (40 - 35 = 5)
        expect(result.creditsNeeded).toBe(2);
        expect(result.newTimeBank).toBe(5);
        expect(result.effectiveDuration).toBe(35);
      });

      it("[P1] should return 3 credits for 50 minutes", () => {
        // GIVEN: 50 minute article
        const durationMinutes = 50;
        const currentTimeBank = 0;

        // WHEN: Calculating credits needed
        const result = calculateCreditsNeeded(durationMinutes, currentTimeBank);

        // THEN: Returns 3 credits (60 min), 10 min banked
        expect(result.creditsNeeded).toBe(3);
        expect(result.newTimeBank).toBe(10);
      });
    });

    describe("Minimum Charge (3 minutes)", () => {
      it("[P1] should apply 3 minute minimum for 1 minute article", () => {
        // GIVEN: 1 minute article (below minimum)
        const durationMinutes = 1;
        const currentTimeBank = 0;

        // WHEN: Calculating credits needed
        const result = calculateCreditsNeeded(durationMinutes, currentTimeBank);

        // THEN: Uses 3 min minimum, 1 credit, 17 min banked (20 - 3)
        expect(result.creditsNeeded).toBe(1);
        expect(result.newTimeBank).toBe(17);
        expect(result.effectiveDuration).toBe(3);
      });

      it("[P1] should apply 3 minute minimum for 0 minute article", () => {
        // GIVEN: 0 minute article
        const durationMinutes = 0;
        const currentTimeBank = 0;

        // WHEN: Calculating credits needed
        const result = calculateCreditsNeeded(durationMinutes, currentTimeBank);

        // THEN: Uses 3 min minimum
        expect(result.creditsNeeded).toBe(1);
        expect(result.effectiveDuration).toBe(3);
      });
    });

    describe("Time Bank Usage", () => {
      it("[P1] should use time bank first before charging credits", () => {
        // GIVEN: 10 minute article with 15 min in time bank
        const durationMinutes = 10;
        const currentTimeBank = 15;

        // WHEN: Calculating credits needed
        const result = calculateCreditsNeeded(durationMinutes, currentTimeBank);

        // THEN: No credits needed, 5 min remaining in bank (15 - 10)
        expect(result.creditsNeeded).toBe(0);
        expect(result.newTimeBank).toBe(5);
      });

      it("[P1] should return 0 credits when time bank covers full duration", () => {
        // GIVEN: 5 minute article with 20 min in time bank
        const durationMinutes = 5;
        const currentTimeBank = 20;

        // WHEN: Calculating credits needed
        const result = calculateCreditsNeeded(durationMinutes, currentTimeBank);

        // THEN: No credits needed, 15 min remaining
        expect(result.creditsNeeded).toBe(0);
        expect(result.newTimeBank).toBe(15);
      });

      it("[P1] should charge reduced credits when time bank partially covers", () => {
        // GIVEN: 25 minute article with 10 min in time bank
        const durationMinutes = 25;
        const currentTimeBank = 10;

        // WHEN: Calculating credits needed
        // Net duration = 25 - 10 = 15 min
        // Credits needed = ceil(15 / 20) = 1
        // Time provided = 1 * 20 = 20 min
        // New time bank = 20 - 15 = 5 min
        const result = calculateCreditsNeeded(durationMinutes, currentTimeBank);

        // THEN: 1 credit needed, 5 min new bank
        expect(result.creditsNeeded).toBe(1);
        expect(result.newTimeBank).toBe(5);
      });

      it("[P1] should handle exact time bank match", () => {
        // GIVEN: 15 minute article with exactly 15 min in time bank
        const durationMinutes = 15;
        const currentTimeBank = 15;

        // WHEN: Calculating credits needed
        const result = calculateCreditsNeeded(durationMinutes, currentTimeBank);

        // THEN: No credits needed, 0 min remaining
        expect(result.creditsNeeded).toBe(0);
        expect(result.newTimeBank).toBe(0);
      });

      it("[P2] should handle large time bank with short article", () => {
        // GIVEN: 3 minute article with 100 min in time bank
        const durationMinutes = 3;
        const currentTimeBank = 100;

        // WHEN: Calculating credits needed
        const result = calculateCreditsNeeded(durationMinutes, currentTimeBank);

        // THEN: No credits needed, 97 min remaining
        expect(result.creditsNeeded).toBe(0);
        expect(result.newTimeBank).toBe(97);
      });
    });

    describe("Edge Cases", () => {
      it("[P2] should handle exactly 40 minutes (2 credits boundary)", () => {
        const result = calculateCreditsNeeded(40, 0);
        expect(result.creditsNeeded).toBe(2);
        expect(result.newTimeBank).toBe(0);
      });

      it("[P2] should handle 41 minutes (just over 2 credits)", () => {
        const result = calculateCreditsNeeded(41, 0);
        expect(result.creditsNeeded).toBe(3);
        expect(result.newTimeBank).toBe(19); // 60 - 41 = 19
      });

      it("[P2] should handle negative duration gracefully", () => {
        // Negative duration should be treated as minimum
        const result = calculateCreditsNeeded(-5, 0);
        expect(result.creditsNeeded).toBe(1);
        expect(result.effectiveDuration).toBe(3); // Minimum charge
      });
    });
  });

  describe("estimateDurationFromWords", () => {
    it("[P2] should estimate 1 minute for 150 words", () => {
      expect(estimateDurationFromWords(150)).toBe(1);
    });

    it("[P2] should estimate 10 minutes for 1500 words", () => {
      expect(estimateDurationFromWords(1500)).toBe(10);
    });

    it("[P2] should round to nearest minute", () => {
      expect(estimateDurationFromWords(225)).toBe(2); // 1.5 rounds to 2
      expect(estimateDurationFromWords(75)).toBe(1); // 0.5 rounds to 1
    });

    it("[P2] should return 0 for 0 words", () => {
      expect(estimateDurationFromWords(0)).toBe(0);
    });
  });
});
