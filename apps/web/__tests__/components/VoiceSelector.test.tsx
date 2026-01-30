/**
 * Component Tests: VoiceSelector
 *
 * Tests for the multi-voice selection component with horizontal scroll.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VoiceSelector } from "@/components/app/VoiceSelector";
import { AudioPlayerProvider } from "@/providers/AudioPlayerProvider";
import { VOICES } from "@/lib/voices";

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement) {
  return render(<AudioPlayerProvider>{ui}</AudioPlayerProvider>);
}

describe("VoiceSelector Component", () => {
  const defaultProps = {
    value: "af_alloy",
    onChange: vi.fn(),
    isLoaded: true,
  };

  describe("Rendering", () => {
    it("[P1] should render all 19 voice cards when loaded", () => {
      // GIVEN: VoiceSelector component with isLoaded=true
      // WHEN: Rendering component
      renderWithProviders(<VoiceSelector {...defaultProps} />);

      // THEN: All 19 voices are displayed
      VOICES.forEach((voice) => {
        expect(screen.getByText(voice.name)).toBeInTheDocument();
      });
    });

    it("[P1] should render label", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      renderWithProviders(<VoiceSelector {...defaultProps} />);

      // THEN: Label is displayed
      expect(screen.getByText("Voice")).toBeInTheDocument();
    });

    it("[P1] should show loading skeleton when not loaded", () => {
      // GIVEN: VoiceSelector with isLoaded=false
      // WHEN: Rendering component
      renderWithProviders(<VoiceSelector {...defaultProps} isLoaded={false} />);

      // THEN: Skeleton placeholders are shown (4 animated divs)
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });

    it("[P1] should display voice style on each card", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      renderWithProviders(<VoiceSelector {...defaultProps} />);

      // THEN: First voice style is shown
      expect(screen.getByText("Balanced")).toBeInTheDocument();
    });
  });

  describe("Selection", () => {
    it("[P1] should highlight selected voice card", () => {
      // GIVEN: VoiceSelector with af_alloy selected
      // WHEN: Rendering component
      renderWithProviders(<VoiceSelector {...defaultProps} value="af_alloy" />);

      // THEN: Alloy card has selected styling (role="button" div)
      const alloyCard = screen.getByText("Alloy").closest('[role="button"]');
      expect(alloyCard).toHaveClass("bg-[var(--foreground)]");
    });

    it("[P1] should call onChange when clicking a different voice", () => {
      // GIVEN: VoiceSelector with onChange handler
      const onChange = vi.fn();

      // WHEN: Clicking on a different voice
      renderWithProviders(
        <VoiceSelector {...defaultProps} onChange={onChange} />
      );
      fireEvent.click(screen.getByText("Sarah"));

      // THEN: onChange is called with new voice id
      expect(onChange).toHaveBeenCalledWith("af_sarah");
    });

    it("[P1] should show preview button on each card", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      renderWithProviders(<VoiceSelector {...defaultProps} />);

      // THEN: Preview buttons are present (one per voice)
      const previewButtons = screen.getAllByText("Preview");
      expect(previewButtons.length).toBe(VOICES.length);
    });
  });

  describe("Disabled State", () => {
    it("[P1] should disable preview buttons when disabled prop is true", () => {
      // GIVEN: VoiceSelector with disabled=true
      // WHEN: Rendering component
      renderWithProviders(<VoiceSelector {...defaultProps} disabled={true} />);

      // THEN: All preview buttons are disabled
      const previewButtons = screen.getAllByText("Preview");
      previewButtons.forEach((button) => {
        expect(button.closest("button")).toBeDisabled();
      });
    });
  });
});
