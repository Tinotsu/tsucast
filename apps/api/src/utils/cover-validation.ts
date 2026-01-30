/**
 * Cover Image/Emoji Validation
 *
 * Validates cover values for security and format correctness.
 * Covers can be either:
 * - Image URL (http:// or https://)
 * - Emoji (short string, max 10 chars for complex emoji with modifiers)
 */

/**
 * Check if a cover value is an image URL (vs emoji)
 */
export function isImageUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

/**
 * Validate a cover value for security and format
 *
 * @param value - The cover value to validate
 * @returns Validation result with error message if invalid
 */
export function validateCover(value: string): { valid: boolean; error?: string } {
  // Max length check first (prevents DoS with huge strings)
  if (value.length > 2048) {
    return { valid: false, error: 'Cover value exceeds 2048 character limit' };
  }

  // Empty string is valid (treated as null/clear by caller)
  if (value === '') {
    return { valid: true };
  }

  // URL validation
  if (isImageUrl(value)) {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { valid: false, error: 'Only http and https URLs are allowed' };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  // Check for dangerous protocols (even without http/https prefix)
  const lowerValue = value.toLowerCase();
  if (lowerValue.startsWith('javascript:') || lowerValue.startsWith('data:')) {
    return { valid: false, error: 'Only http and https URLs are allowed' };
  }

  // Emoji validation - check it's reasonable length
  // Complex emoji with modifiers (skin tone, gender, ZWJ sequences) can be up to 10 chars
  if (value.length > 10) {
    return { valid: false, error: 'Emoji cover must be 10 characters or less' };
  }

  return { valid: true };
}

/**
 * Normalize a cover value for storage
 * - Empty string → null
 * - Whitespace-only → null
 * - Otherwise → trimmed value
 */
export function normalizeCover(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
