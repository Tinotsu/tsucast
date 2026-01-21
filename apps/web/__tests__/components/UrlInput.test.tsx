/**
 * Component Tests: UrlInput
 *
 * Tests for the URL input component with cache checking.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UrlInput } from "@/components/app/UrlInput";

// Mock the API module
vi.mock("@/lib/api", () => ({
  checkCache: vi.fn(),
}));

describe("UrlInput Component", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("[P1] should render input with placeholder", () => {
      // GIVEN: UrlInput component
      // WHEN: Rendering component
      render(<UrlInput {...defaultProps} />);

      // THEN: Input with placeholder is displayed
      expect(screen.getByPlaceholderText("https://example.com/article")).toBeInTheDocument();
    });

    it("[P1] should render label", () => {
      // GIVEN: UrlInput component
      // WHEN: Rendering component
      render(<UrlInput {...defaultProps} />);

      // THEN: Label is displayed
      expect(screen.getByText("Article URL")).toBeInTheDocument();
    });

    it("[P1] should display current value", () => {
      // GIVEN: UrlInput with value
      // WHEN: Rendering component
      render(<UrlInput {...defaultProps} value="https://example.com/test" />);

      // THEN: Input shows the value
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("https://example.com/test");
    });
  });

  describe("Input Handling", () => {
    it("[P1] should call onChange when typing", () => {
      // GIVEN: UrlInput with onChange handler
      const onChange = vi.fn();
      render(<UrlInput {...defaultProps} onChange={onChange} />);

      // WHEN: Typing in input
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "https://test.com" } });

      // THEN: onChange is called with new value
      expect(onChange).toHaveBeenCalledWith("https://test.com");
    });
  });

  describe("URL Validation", () => {
    it("[P1] should show error for invalid URL", () => {
      // GIVEN: UrlInput component
      const onChange = vi.fn();
      render(<UrlInput {...defaultProps} onChange={onChange} />);

      // WHEN: Entering invalid URL
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "not-a-url" } });

      // THEN: Error message is displayed
      expect(screen.getByText("Please enter a valid URL")).toBeInTheDocument();
    });

    it("[P1] should not show error for valid URL", () => {
      // GIVEN: UrlInput with valid URL
      const onChange = vi.fn();
      render(<UrlInput {...defaultProps} onChange={onChange} value="" />);

      // WHEN: Entering valid URL
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "https://example.com/article" } });

      // THEN: No error message
      expect(screen.queryByText("Please enter a valid URL")).not.toBeInTheDocument();
    });

    it("[P2] should accept http URLs", () => {
      // GIVEN: UrlInput component
      const onChange = vi.fn();
      render(<UrlInput {...defaultProps} onChange={onChange} />);

      // WHEN: Entering http URL
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "http://example.com" } });

      // THEN: No error message (http is valid)
      expect(screen.queryByText("Please enter a valid URL")).not.toBeInTheDocument();
    });

    it("[P2] should reject non-http protocols", () => {
      // GIVEN: UrlInput component
      const onChange = vi.fn();
      render(<UrlInput {...defaultProps} onChange={onChange} />);

      // WHEN: Entering ftp URL
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "ftp://example.com" } });

      // THEN: Error message is displayed
      expect(screen.getByText("Please enter a valid URL")).toBeInTheDocument();
    });

    it("[P2] should reject javascript protocol", () => {
      // GIVEN: UrlInput component
      const onChange = vi.fn();
      render(<UrlInput {...defaultProps} onChange={onChange} />);

      // WHEN: Entering javascript URL
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "javascript:alert(1)" } });

      // THEN: Error message is displayed
      expect(screen.getByText("Please enter a valid URL")).toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("[P1] should disable input when disabled prop is true", () => {
      // GIVEN: Disabled UrlInput
      // WHEN: Rendering component
      render(<UrlInput {...defaultProps} disabled={true} />);

      // THEN: Input is disabled
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("[P2] should have disabled styling", () => {
      // GIVEN: Disabled UrlInput
      // WHEN: Rendering component
      render(<UrlInput {...defaultProps} disabled={true} />);

      // THEN: Input has disabled class
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("disabled:opacity-50");
    });
  });

  describe("Visual States", () => {
    it("[P2] should show error icon for invalid URL", () => {
      // GIVEN: UrlInput component
      const onChange = vi.fn();
      render(<UrlInput {...defaultProps} onChange={onChange} />);

      // WHEN: Entering invalid URL
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "invalid" } });

      // THEN: Error message shown
      expect(screen.getByText("Please enter a valid URL")).toBeInTheDocument();
    });

    it("[P2] should clear error when valid URL entered after invalid", () => {
      // GIVEN: UrlInput with invalid URL error
      const onChange = vi.fn();
      render(<UrlInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "invalid" } });
      expect(screen.getByText("Please enter a valid URL")).toBeInTheDocument();

      // WHEN: Entering valid URL
      fireEvent.change(input, { target: { value: "https://example.com" } });

      // THEN: Error message is cleared
      expect(screen.queryByText("Please enter a valid URL")).not.toBeInTheDocument();
    });
  });

  describe("Input Type", () => {
    it("[P2] should have type url for semantic correctness", () => {
      // GIVEN: UrlInput component
      // WHEN: Rendering component
      render(<UrlInput {...defaultProps} />);

      // THEN: Input has type url
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "url");
    });
  });
});
