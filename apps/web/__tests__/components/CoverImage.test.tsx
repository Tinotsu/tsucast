/**
 * Component Tests: CoverImage
 *
 * Tests for the cover image component that handles URLs, emojis, and fallbacks.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CoverImage } from "@/components/ui/CoverImage";

describe("CoverImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Fallback State", () => {
    it("[P1] should show headphones icon when cover is null", () => {
      render(<CoverImage cover={null} size={48} />);
      // The fallback should be rendered - a div with headphones
      const container = document.querySelector('[style*="width: 48px"]');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("bg-amber-100");
    });

    it("[P1] should show headphones icon when cover is empty string", () => {
      render(<CoverImage cover="" size={48} />);
      const container = document.querySelector('[style*="width: 48px"]');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("bg-amber-100");
    });

    it("[P2] should size the fallback icon based on size prop", () => {
      render(<CoverImage cover={null} size={100} />);
      const container = document.querySelector('[style*="width: 100px"]');
      expect(container).toBeInTheDocument();
    });
  });

  describe("Image URL", () => {
    it("[P1] should render img tag for http URL", () => {
      const { container } = render(<CoverImage cover="http://example.com/image.jpg" size={48} />);
      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "http://example.com/image.jpg");
    });

    it("[P1] should render img tag for https URL", () => {
      const { container } = render(<CoverImage cover="https://example.com/image.jpg" size={48} />);
      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
    });

    it("[P1] should set width and height from size prop", () => {
      const { container } = render(<CoverImage cover="https://example.com/image.jpg" size={64} />);
      const img = container.querySelector("img");
      expect(img).toHaveAttribute("width", "64");
      expect(img).toHaveAttribute("height", "64");
    });

    it("[P2] should have lazy loading enabled", () => {
      const { container } = render(<CoverImage cover="https://example.com/image.jpg" size={48} />);
      const img = container.querySelector("img");
      expect(img).toHaveAttribute("loading", "lazy");
    });

    it("[P1] should show fallback on image error", () => {
      const { container } = render(<CoverImage cover="https://example.com/broken.jpg" size={48} />);
      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();

      fireEvent.error(img!);

      // After error, should show fallback (no more img)
      expect(container.querySelector("img")).not.toBeInTheDocument();
      const fallback = document.querySelector('[style*="width: 48px"]');
      expect(fallback).toHaveClass("bg-amber-100");
    });
  });

  describe("Emoji", () => {
    it("[P1] should render emoji in centered container", () => {
      render(<CoverImage cover="📚" size={48} />);
      const container = document.querySelector('[style*="width: 48px"]');
      expect(container).toBeInTheDocument();
      expect(container).toHaveTextContent("📚");
    });

    it("[P1] should not render as img for emoji", () => {
      render(<CoverImage cover="🎧" size={48} />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("[P2] should size emoji font based on size prop", () => {
      render(<CoverImage cover="📖" size={100} />);
      const container = document.querySelector('[style*="font-size: 60px"]');
      expect(container).toBeInTheDocument();
    });

    it("[P1] should handle multi-codepoint emoji", () => {
      render(<CoverImage cover="🎙️" size={48} />);
      const container = document.querySelector('[style*="width: 48px"]');
      expect(container).toHaveTextContent("🎙️");
    });
  });

  describe("Custom className", () => {
    it("[P2] should apply custom className to fallback", () => {
      render(<CoverImage cover={null} size={48} className="custom-class" />);
      const container = document.querySelector('[style*="width: 48px"]');
      expect(container).toHaveClass("custom-class");
    });

    it("[P2] should apply custom className to image", () => {
      const { container } = render(<CoverImage cover="https://example.com/image.jpg" size={48} className="custom-class" />);
      const img = container.querySelector("img");
      expect(img).toHaveClass("custom-class");
    });

    it("[P2] should apply custom className to emoji container", () => {
      render(<CoverImage cover="📚" size={48} className="custom-class" />);
      const container = document.querySelector('[style*="width: 48px"]');
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("Edge Cases", () => {
    it("[P2] should handle text that looks like URL but isn't", () => {
      // Text that contains "http" but isn't a valid URL
      render(<CoverImage cover="not-a-url-http" size={48} />);
      // Should render as emoji/text, not as img
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("[P2] should handle plain text (treat as emoji)", () => {
      render(<CoverImage cover="ABC" size={48} />);
      const container = document.querySelector('[style*="width: 48px"]');
      expect(container).toHaveTextContent("ABC");
    });
  });
});
