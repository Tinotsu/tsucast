import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";

describe("Landing Page Components", () => {
  describe("Header", () => {
    it("renders logo and navigation", () => {
      render(<Header />);

      expect(screen.getByText("tsucast")).toBeInTheDocument();
      expect(screen.getByText("Features")).toBeInTheDocument();
      expect(screen.getByText("Pricing")).toBeInTheDocument();
      expect(screen.getByText("Sign In")).toBeInTheDocument();
      expect(screen.getByText("Download App")).toBeInTheDocument();
    });
  });

  describe("Hero", () => {
    it("renders main headline and CTA", () => {
      render(<Hero />);

      expect(screen.getByText(/Turn Any Article Into a/)).toBeInTheDocument();
      expect(screen.getByText("Podcast")).toBeInTheDocument();
      expect(screen.getByText("Download for iOS")).toBeInTheDocument();
      expect(screen.getByText("Get on Android")).toBeInTheDocument();
    });

    it("shows value proposition", () => {
      render(<Hero />);

      expect(
        screen.getByText(/Paste any URL, pick a voice/)
      ).toBeInTheDocument();
    });
  });

  describe("Features", () => {
    it("renders all features", () => {
      render(<Features />);

      expect(screen.getByText("Lightning Fast")).toBeInTheDocument();
      expect(screen.getByText("Premium AI Voices")).toBeInTheDocument();
      expect(screen.getByText("Personal Library")).toBeInTheDocument();
      expect(screen.getByText("Sleep Timer")).toBeInTheDocument();
      expect(screen.getByText("Background Play")).toBeInTheDocument();
      expect(screen.getByText("Remember Position")).toBeInTheDocument();
      expect(screen.getByText("Works Anywhere")).toBeInTheDocument();
      expect(screen.getByText("Speed Control")).toBeInTheDocument();
    });
  });

  describe("Pricing", () => {
    it("renders free and pro plans", () => {
      render(<Pricing />);

      expect(screen.getByText("Free")).toBeInTheDocument();
      expect(screen.getByText("Pro")).toBeInTheDocument();
      expect(screen.getByText("$0")).toBeInTheDocument();
      expect(screen.getByText("$9.99")).toBeInTheDocument();
    });

    it("shows features for each plan", () => {
      render(<Pricing />);

      expect(screen.getByText("3 articles per day")).toBeInTheDocument();
      expect(screen.getByText("Unlimited articles")).toBeInTheDocument();
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
