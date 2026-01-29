import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";

// Mock IntersectionObserver for Features component
beforeAll(() => {
  const mockIntersectionObserver = vi.fn().mockReturnValue({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  });
  vi.stubGlobal("IntersectionObserver", mockIntersectionObserver);
});

describe("Landing Page Components", () => {
  describe("Header", () => {
    it("renders logo and navigation", () => {
      render(<Header />);

      expect(screen.getByText("tsucast")).toBeInTheDocument();
      expect(screen.getByText("Pricing")).toBeInTheDocument();
      expect(screen.getByText("Sign In")).toBeInTheDocument();
      // Night mode toggle should be present
      expect(screen.getByTestId("night-mode-toggle")).toBeInTheDocument();
    });
  });

  describe("Hero", () => {
    it("renders main headline", () => {
      render(<Hero />);

      // New design: "Any article. Any voice. 10 seconds."
      expect(screen.getByText(/Any article\. Any voice\./)).toBeInTheDocument();
      expect(screen.getByText(/10 seconds\./)).toBeInTheDocument();
    });

    it("shows value proposition", () => {
      render(<Hero />);

      expect(
        screen.getByText(/Paste any URL, pick a voice/)
      ).toBeInTheDocument();
    });

    it("renders logo", () => {
      render(<Hero />);

      expect(screen.getByTestId("hero-headline")).toBeInTheDocument();
    });
  });

  describe("Features", () => {
    it("renders all features", () => {
      render(<Features />);

      // Updated features from current design
      expect(screen.getByText("Lightning Fast")).toBeInTheDocument();
      expect(screen.getByText("Premium AI Voices")).toBeInTheDocument();
      expect(screen.getByText("Personal Library")).toBeInTheDocument();
      expect(screen.getByText("Sleep Timer")).toBeInTheDocument();
      expect(screen.getByText("Works Anywhere")).toBeInTheDocument();
      expect(screen.getByText("Speed Control")).toBeInTheDocument();
    });
  });

  describe("Pricing", () => {
    it("renders credit packs", () => {
      render(<Pricing />);

      expect(screen.getByText("Coffee")).toBeInTheDocument();
      expect(screen.getByText("Kebab")).toBeInTheDocument();
      expect(screen.getByText("Pizza")).toBeInTheDocument();
      expect(screen.getByText("Feast")).toBeInTheDocument();
      expect(screen.getByText("$4.99")).toBeInTheDocument();
      expect(screen.getByText("$8.99")).toBeInTheDocument();
      expect(screen.getByText("$16.99")).toBeInTheDocument();
      expect(screen.getByText("$39.99")).toBeInTheDocument();
    });

    it("shows credit counts and features", () => {
      render(<Pricing />);

      expect(screen.getByText(/15 credits \(\$0\.33\/article\)/)).toBeInTheDocument();
      expect(screen.getByText(/30 credits \(\$0\.30\/article\)/)).toBeInTheDocument();
      expect(screen.getByText(/60 credits \(\$0\.28\/article\)/)).toBeInTheDocument();
      expect(screen.getByText(/150 credits \(\$0\.27\/article\)/)).toBeInTheDocument();
      expect(screen.getByText("Credits never expire")).toBeInTheDocument();
      expect(screen.getByText("Personal audio library")).toBeInTheDocument();
    });

    it("shows Popular badge on Coffee pack", () => {
      render(<Pricing />);

      expect(screen.getByText("Popular")).toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("renders brand and links", () => {
      render(<Footer />);

      expect(screen.getAllByText("tsucast")[0]).toBeInTheDocument();
      expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
      expect(screen.getByText("Terms of Service")).toBeInTheDocument();
    });
  });
});
