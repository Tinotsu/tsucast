/**
 * Component Tests: VoiceSelector
 *
 * Tests for the voice selection component.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VoiceSelector } from "@/components/app/VoiceSelector";

describe("VoiceSelector Component", () => {
  const defaultProps = {
    value: "alloy",
    onChange: vi.fn(),
  };

  describe("Rendering", () => {
    it("[P1] should render all voice options", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} />);

      // THEN: All voices are displayed
      expect(screen.getByText("Alloy")).toBeInTheDocument();
      expect(screen.getByText("Echo")).toBeInTheDocument();
      expect(screen.getByText("Fable")).toBeInTheDocument();
      expect(screen.getByText("Onyx")).toBeInTheDocument();
      expect(screen.getByText("Nova")).toBeInTheDocument();
    });

    it("[P1] should render label", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} />);

      // THEN: Label is displayed
      expect(screen.getByText("Select Voice")).toBeInTheDocument();
    });

    it("[P1] should display gender and accent for each voice", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} />);

      // THEN: Gender and accent info is shown
      expect(screen.getAllByText(/Female.*American/)).toHaveLength(2); // Alloy and Nova
      expect(screen.getByText(/Male.*British/)).toBeInTheDocument(); // Fable
    });
  });

  describe("Selection", () => {
    it("[P1] should highlight selected voice", () => {
      // GIVEN: VoiceSelector with alloy selected
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} value="alloy" />);

      // THEN: Alloy button has selected styling
      const alloyButton = screen.getByText("Alloy").closest("button");
      expect(alloyButton).toHaveClass("border-amber-500");
    });

    it("[P1] should call onChange when voice is selected", () => {
      // GIVEN: VoiceSelector with onChange handler
      const onChange = vi.fn();
      render(<VoiceSelector {...defaultProps} onChange={onChange} />);

      // WHEN: Clicking a different voice
      const echoButton = screen.getByText("Echo").closest("button");
      fireEvent.click(echoButton!);

      // THEN: onChange is called with new voice id
      expect(onChange).toHaveBeenCalledWith("echo");
    });

    it("[P1] should show checkmark on selected voice", () => {
      // GIVEN: VoiceSelector with echo selected
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} value="echo" />);

      // THEN: Echo has checkmark (SVG with specific class)
      const echoButton = screen.getByText("Echo").closest("button");
      const checkmark = echoButton?.querySelector("svg.h-4.w-4");
      expect(checkmark).toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("[P1] should disable all buttons when disabled", () => {
      // GIVEN: VoiceSelector in disabled state
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} disabled={true} />);

      // THEN: All voice buttons are disabled
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("[P2] should not call onChange when disabled", () => {
      // GIVEN: Disabled VoiceSelector
      const onChange = vi.fn();
      render(<VoiceSelector {...defaultProps} onChange={onChange} disabled={true} />);

      // WHEN: Trying to click a voice
      const echoButton = screen.getByText("Echo").closest("button");
      fireEvent.click(echoButton!);

      // THEN: onChange is not called
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("Voice Data", () => {
    it("[P2] should have 5 voice options", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} />);

      // THEN: 5 voice buttons are rendered
      const voiceButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.match(/Alloy|Echo|Fable|Onyx|Nova/));
      expect(voiceButtons).toHaveLength(5);
    });

    it("[P2] should display American accent for most voices", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} />);

      // THEN: American accent appears multiple times
      const americanAccents = screen.getAllByText(/American/);
      expect(americanAccents.length).toBeGreaterThanOrEqual(3);
    });

    it("[P2] should have Fable as British voice", () => {
      // GIVEN: VoiceSelector component
      // WHEN: Rendering component
      render(<VoiceSelector {...defaultProps} />);

      // THEN: Fable shows British accent
      const fableSection = screen.getByText("Fable").closest("button");
      expect(fableSection?.textContent).toContain("British");
    });
  });
});
