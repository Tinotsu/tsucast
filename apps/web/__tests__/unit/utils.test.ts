/**
 * Unit Tests: lib/utils.ts
 *
 * Tests for utility functions.
 */

import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (classnames utility)", () => {
  it("[P2] should merge class names", () => {
    // GIVEN: Multiple class names
    // WHEN: Merging them
    const result = cn("foo", "bar");

    // THEN: Returns combined string
    expect(result).toBe("foo bar");
  });

  it("[P2] should handle conditional classes", () => {
    // GIVEN: Conditional class objects
    // WHEN: Merging with conditions
    const result = cn("base", { active: true, disabled: false });

    // THEN: Only includes truthy conditions
    expect(result).toBe("base active");
    expect(result).not.toContain("disabled");
  });

  it("[P2] should handle arrays", () => {
    // GIVEN: Array of classes
    // WHEN: Merging array
    const result = cn(["foo", "bar"], "baz");

    // THEN: Flattens and combines
    expect(result).toBe("foo bar baz");
  });

  it("[P2] should merge Tailwind classes correctly", () => {
    // GIVEN: Conflicting Tailwind classes
    // WHEN: Merging them
    const result = cn("p-4", "p-8");

    // THEN: Later class wins (tailwind-merge behavior)
    expect(result).toBe("p-8");
  });

  it("[P2] should handle undefined and null", () => {
    // GIVEN: Undefined and null values
    // WHEN: Merging with them
    const result = cn("foo", undefined, null, "bar");

    // THEN: Ignores falsy values
    expect(result).toBe("foo bar");
  });

  it("[P2] should handle empty strings", () => {
    // GIVEN: Empty strings
    // WHEN: Merging with them
    const result = cn("foo", "", "bar");

    // THEN: Ignores empty strings
    expect(result).toBe("foo bar");
  });

  it("[P2] should merge complex Tailwind variants", () => {
    // GIVEN: Complex Tailwind variants
    // WHEN: Merging them
    const result = cn(
      "text-red-500",
      "hover:text-blue-500",
      "text-green-500" // Should override text-red-500
    );

    // THEN: Base class overridden, variant preserved
    expect(result).toContain("text-green-500");
    expect(result).toContain("hover:text-blue-500");
    expect(result).not.toContain("text-red-500");
  });
});
