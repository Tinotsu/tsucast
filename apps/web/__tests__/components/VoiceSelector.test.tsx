/**
 * Component Tests: VoiceSelector
 *
 * Tests for the voice selection component (MVP: single voice only).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VoiceSelector } from "@/components/app/VoiceSelector";

describe("VoiceSelector Component", () => {
  const defaultProps = {
    value: "default",
    onChange: vi.fn(),
  };

  describe("Rendering", () => {
    it("[P1] should render default voice", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} />);

      // THEN: Default voice is displayed
      expect(screen.getByText("Default")).toBeInTheDocument();
    });

    it("[P1] should render label", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} />);

      // THEN: Label is displayed
      expect(screen.getByText("Voice")).toBeInTheDocument();
    });

    it("[P1] should display gender and accent for default voice", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} />);

      // THEN: Gender and accent info is shown
      expect(screen.getByText(/Female.*American/)).toBeInTheDocument();
    });

    it("[P1] should show coming soon message", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} />);

      // THEN: Coming soon message is shown
      expect(screen.getByText("More voices coming soon")).toBeInTheDocument();
    });
  });

  describe("Selection", () => {
    it("[P1] should show default voice as selected", () => {
      // GIVEN: VoiceSelector with default selected
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} value="default" />);

      // THEN: Default voice container is rendered
      const container = screen.getByText("Default").closest("div");
      expect(container).toBeInTheDocument();
    });

    it("[P1] should auto-select default voice if different value passed", () => {
      // GIVEN: VoiceSelector with onChange handler
      const onChange = vi.fn();

      // WHEN: Rendering with non-default value
      render(<VoiceSelector value="other" onChange={onChange} />);

      // THEN: onChange is called with default voice id
      expect(onChange).toHaveBeenCalledWith("default");
    });

    it("[P1] should show checkmark on selected voice", () => {
      // GIVEN: VoiceSelector with default selected
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} />);

      // THEN: Checkmark SVG is visible (lucide-react renders svg with lucide class)
      const checkmark = document.querySelector("svg");
      expect(checkmark).toBeInTheDocument();
    });
  });
});
