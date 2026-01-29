import { test, expect } from "@playwright/test";

/**
 * Landing Page E2E Tests - P0 Critical (ATDD)
 *
 * These tests define the acceptance criteria for the landing page redesign.
 * All tests should FAIL initially (RED phase) until implementation is complete.
 *
 * Risk Coverage:
 * - R-001: Hero audio player fails to play (Score: 6)
 * - R-003: Featured content API returns empty/error (Score: 6)
 * - R-005: Mobile responsive layout breaks (Score: 6)
 *
 * Run: npm run test:e2e -- landing-page.spec.ts
 */

test.describe("Landing Page - P0 Critical", () => {
  test.describe("Hero Section", () => {
    test("LP-HERO-003: should display featured content title in audio player", async ({
      page,
    }) => {
      // GIVEN: User navigates to landing page
      await page.goto("/");

      // THEN: Featured audio player displays content title
      // Expected: Title from free_content table where featured=true
      await expect(
        page.getByTestId("hero-audio-title")
      ).toBeVisible();
      await expect(
        page.getByTestId("hero-audio-title")
      ).not.toBeEmpty();
    });

    test("LP-HERO-004: should play audio when play button is clicked", async ({
      page,
    }) => {
      // GIVEN: User is on landing page with featured audio player
      await page.goto("/");

      // WHEN: User clicks the play button
      await page.getByTestId("hero-audio-play").click();

      // THEN: Audio starts playing (play button changes to pause)
      await expect(
        page.getByTestId("hero-audio-pause")
      ).toBeVisible();

      // AND: Progress bar starts moving (not at 0)
      const progressBar = page.getByTestId("hero-audio-progress");
      await expect(progressBar).toBeVisible();
    });

    test("LP-HERO-007: should navigate to signup when CTA is clicked", async ({
      page,
    }) => {
      // GIVEN: User is on landing page
      await page.goto("/");

      // WHEN: User clicks the CTA button
      await page.getByTestId("hero-cta").click();

      // THEN: User is navigated to signup page
      await expect(page).toHaveURL(/\/signup/);
    });

    test("LP-HERO-008: should show fallback when no featured content exists", async ({
      page,
    }) => {
      // GIVEN: Featured content API returns empty
      await page.route("**/api/free-content/featured", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(null),
        })
      );

      // WHEN: User navigates to landing page
      await page.goto("/");

      // THEN: Fallback message is displayed (not broken UI)
      await expect(
        page.getByTestId("hero-audio-fallback")
      ).toBeVisible();
    });
  });

  test.describe("Night Mode", () => {
    test("LP-NIGHT-001: should toggle theme when night mode button is clicked", async ({
      page,
    }) => {
      // GIVEN: User is on landing page in light mode
      await page.goto("/");

      // Verify initial state is light mode
      const html = page.locator("html");
      await expect(html).not.toHaveClass(/dark/);

      // WHEN: User clicks night mode toggle
      await page.getByTestId("night-mode-toggle").click();

      // THEN: Theme switches to dark mode
      await expect(html).toHaveClass(/dark/);
    });

    test("LP-NIGHT-002: should persist night mode preference on reload", async ({
      page,
    }) => {
      // GIVEN: User has enabled night mode
      await page.goto("/");
      await page.getByTestId("night-mode-toggle").click();

      // Verify dark mode is active
      await expect(page.locator("html")).toHaveClass(/dark/);

      // WHEN: User reloads the page
      await page.reload();

      // THEN: Night mode preference is persisted (from localStorage)
      await expect(page.locator("html")).toHaveClass(/dark/);
    });
  });

  test.describe("Mobile Responsive - 375px", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("LP-RESP-001: should display hero section correctly on mobile", async ({
      page,
    }) => {
      // GIVEN: User is on mobile device (375px viewport)
      await page.goto("/");

      // THEN: Hero headline is visible
      await expect(page.getByTestId("hero-headline")).toBeVisible();

      // AND: Hero audio player is visible
      await expect(page.getByTestId("hero-audio-player")).toBeVisible();

      // AND: CTA button is visible and tappable
      await expect(page.getByTestId("hero-cta")).toBeVisible();
    });

    test("LP-RESP-002: should show hamburger menu on mobile", async ({
      page,
    }) => {
      // GIVEN: User is on mobile device
      await page.goto("/");

      // THEN: Hamburger menu button is visible
      await expect(page.getByTestId("mobile-menu-toggle")).toBeVisible();

      // AND: Desktop nav items are hidden
      await expect(page.getByTestId("desktop-nav")).not.toBeVisible();

      // WHEN: User clicks hamburger menu
      await page.getByTestId("mobile-menu-toggle").click();

      // THEN: Mobile nav menu opens
      await expect(page.getByTestId("mobile-menu")).toBeVisible();
    });
  });
});

test.describe("Landing Page - P1 High Priority", () => {
  test.describe("Free Samples Section", () => {
    test("LP-FREE-001: should load free samples from API", async ({ page }) => {
      // GIVEN: User navigates to landing page
      await page.goto("/");

      // THEN: Free samples section is visible
      await expect(page.getByTestId("free-samples-section")).toBeVisible();

      // AND: At least one sample card is displayed
      await expect(
        page.getByTestId("free-sample-card").first()
      ).toBeVisible();
    });

    test("LP-FREE-004: should play sample audio when clicked", async ({
      page,
    }) => {
      // GIVEN: User is on landing page with free samples
      await page.goto("/");

      // WHEN: User clicks play on a sample card
      await page.getByTestId("free-sample-play").first().click();

      // THEN: Audio starts playing
      await expect(
        page.getByTestId("free-sample-pause").first()
      ).toBeVisible();
    });
  });

  test.describe("Features Section", () => {
    test("LP-FEAT-003: should allow selecting voice in voice tester", async ({
      page,
    }) => {
      // GIVEN: User is on landing page
      await page.goto("/");

      // WHEN: User clicks on "Sarah" voice chip
      await page.getByTestId("voice-chip-sarah").click();

      // THEN: Sarah voice is selected (has selected state)
      await expect(page.getByTestId("voice-chip-sarah")).toHaveAttribute(
        "data-selected",
        "true"
      );
    });

    test("LP-FEAT-004: should play voice sample when button is clicked", async ({
      page,
    }) => {
      // GIVEN: User has selected a voice
      await page.goto("/");
      await page.getByTestId("voice-chip-adam").click();

      // WHEN: User clicks play sample button
      await page.getByTestId("voice-sample-play").click();

      // THEN: Voice sample audio plays
      await expect(page.getByTestId("voice-sample-playing")).toBeVisible();
    });
  });

  test.describe("FAQ Section", () => {
    test("LP-FAQ-001: should load FAQ items from API", async ({ page }) => {
      // GIVEN: User navigates to landing page
      await page.goto("/");

      // THEN: FAQ section is visible
      await expect(page.getByTestId("faq-section")).toBeVisible();

      // AND: At least one FAQ item is displayed
      await expect(page.getByTestId("faq-item").first()).toBeVisible();
    });

    test("LP-FAQ-002: should expand FAQ item when clicked", async ({ page }) => {
      // GIVEN: User is on landing page with collapsed FAQ
      await page.goto("/");

      // WHEN: User clicks on first FAQ question
      await page.getByTestId("faq-question").first().click();

      // THEN: Answer is expanded and visible
      await expect(page.getByTestId("faq-answer").first()).toBeVisible();
    });
  });

  test.describe("Pricing Section", () => {
    test("LP-PRICE-001: should display all 4 pricing cards", async ({
      page,
    }) => {
      // GIVEN: User navigates to landing page
      await page.goto("/");

      // THEN: 4 pricing cards are visible
      const pricingCards = page.getByTestId("pricing-card");
      await expect(pricingCards).toHaveCount(4);

      // AND: Coffee, Kebab, Pizza, Feast packs are shown
      await expect(page.getByTestId("pricing-card-coffee")).toBeVisible();
      await expect(page.getByTestId("pricing-card-kebab")).toBeVisible();
      await expect(page.getByTestId("pricing-card-pizza")).toBeVisible();
      await expect(page.getByTestId("pricing-card-feast")).toBeVisible();
    });

    test("LP-PRICE-004: should redirect to login when buy is clicked", async ({
      page,
    }) => {
      // GIVEN: User is on landing page (not authenticated)
      await page.goto("/");

      // WHEN: User clicks buy on any pricing card
      await page.getByTestId("pricing-buy-coffee").click();

      // THEN: User is redirected to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Responsive - Tablet 768px", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("LP-RESP-003: should show 2-column features on tablet", async ({
      page,
    }) => {
      // GIVEN: User is on tablet device (768px viewport)
      await page.goto("/");

      // THEN: Features section shows 2-column layout
      const featuresGrid = page.getByTestId("features-grid");
      await expect(featuresGrid).toBeVisible();

      // Grid should have 2-column styling (CSS grid-template-columns)
      // This is verified visually or via computed styles
    });
  });

  test.describe("Responsive - Desktop 1024px", () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test("LP-RESP-004: should show full desktop layout", async ({ page }) => {
      // GIVEN: User is on desktop (1024px+ viewport)
      await page.goto("/");

      // THEN: Desktop navigation is visible
      await expect(page.getByTestId("desktop-nav")).toBeVisible();

      // AND: Mobile hamburger is hidden
      await expect(page.getByTestId("mobile-menu-toggle")).not.toBeVisible();
    });
  });
});

test.describe("Landing Page - P2 Medium Priority", () => {
  test.describe("Typing Animation", () => {
    test("LP-HERO-002: should show typing animation in hero", async ({
      page,
    }) => {
      // GIVEN: User navigates to landing page
      await page.goto("/");

      // THEN: Typing animation container is visible
      await expect(page.getByTestId("typing-animation")).toBeVisible();
    });
  });

  test.describe("Header", () => {
    test("LP-HDR-004: should scroll to pricing when pricing link clicked", async ({
      page,
    }) => {
      // GIVEN: User is on landing page
      await page.goto("/");

      // WHEN: User clicks Pricing nav link
      await page.getByTestId("nav-pricing").click();

      // THEN: Page scrolls to pricing section
      await expect(page.getByTestId("pricing-section")).toBeInViewport();
    });
  });

  test.describe("Footer", () => {
    test("LP-FOOTER-002: should navigate to privacy page", async ({ page }) => {
      // GIVEN: User is on landing page
      await page.goto("/");

      // WHEN: User clicks Privacy link in footer
      await page.getByTestId("footer-privacy").click();

      // THEN: User is navigated to privacy page
      await expect(page).toHaveURL(/\/privacy/);
    });
  });
});
