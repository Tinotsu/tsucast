/**
 * Auth Error Message Tests
 *
 * Tests for authentication error message mapping logic
 * Priority: P0 (Critical - authentication error handling)
 *
 * Note: This tests the pure function logic extracted from useAuth.ts
 * to avoid React Native module dependencies in unit tests.
 */

// Map Supabase auth errors to user-friendly messages
// This is the same logic as in hooks/useAuth.ts
function getAuthErrorMessage(error: { message?: string } | null): string {
  if (!error) return '';

  const errorCode = error.message?.toLowerCase() || '';

  if (errorCode.includes('invalid login credentials') || errorCode.includes('invalid_credentials')) {
    return 'Invalid email or password';
  }
  if (errorCode.includes('email not confirmed')) {
    return 'Please verify your email before signing in';
  }
  if (errorCode.includes('user already registered') || errorCode.includes('already exists')) {
    return 'An account with this email already exists';
  }
  if (errorCode.includes('password') && errorCode.includes('least')) {
    return 'Password must be at least 8 characters';
  }
  if (errorCode.includes('invalid email')) {
    return 'Please enter a valid email address';
  }
  if (errorCode.includes('network') || errorCode.includes('fetch')) {
    return 'Unable to connect. Check your internet connection.';
  }

  // Default fallback
  return error.message || 'An error occurred. Please try again.';
}

describe('useAuth Hook', () => {
  describe('[P0] getAuthErrorMessage', () => {
    describe('valid credentials errors', () => {
      it('should map invalid login credentials error', () => {
        // GIVEN: Supabase invalid credentials error
        const error = { message: 'Invalid login credentials' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns user-friendly message
        expect(result).toBe('Invalid email or password');
      });

      it('should map invalid_credentials code', () => {
        // GIVEN: Error with invalid_credentials
        const error = { message: 'invalid_credentials error occurred' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns user-friendly message
        expect(result).toBe('Invalid email or password');
      });
    });

    describe('email verification errors', () => {
      it('should map email not confirmed error', () => {
        // GIVEN: Email not confirmed error
        const error = { message: 'Email not confirmed' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns verification message
        expect(result).toBe('Please verify your email before signing in');
      });
    });

    describe('registration errors', () => {
      it('should map user already registered error', () => {
        // GIVEN: User exists error
        const error = { message: 'User already registered' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns duplicate account message
        expect(result).toBe('An account with this email already exists');
      });

      it('should map already exists error', () => {
        // GIVEN: Email already exists
        const error = { message: 'Email already exists' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns duplicate account message
        expect(result).toBe('An account with this email already exists');
      });
    });

    describe('password validation errors', () => {
      it('should map password length error', () => {
        // GIVEN: Password too short error
        const error = { message: 'Password should be at least 8 characters' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns password length message
        expect(result).toBe('Password must be at least 8 characters');
      });

      it('should handle various password length phrasings', () => {
        // GIVEN: Different password error phrasing
        const error = { message: 'password must contain at least 8 characters' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns password length message
        expect(result).toBe('Password must be at least 8 characters');
      });
    });

    describe('email validation errors', () => {
      it('should map invalid email error', () => {
        // GIVEN: Invalid email error
        const error = { message: 'Invalid email format' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns email validation message
        expect(result).toBe('Please enter a valid email address');
      });
    });

    describe('network errors', () => {
      it('should map network error', () => {
        // GIVEN: Network error
        const error = { message: 'Network request failed' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns network error message
        expect(result).toBe('Unable to connect. Check your internet connection.');
      });

      it('should map fetch error', () => {
        // GIVEN: Fetch error
        const error = { message: 'Failed to fetch' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns network error message
        expect(result).toBe('Unable to connect. Check your internet connection.');
      });
    });

    describe('edge cases', () => {
      it('should return empty string for null error', () => {
        // GIVEN: Null error
        const error = null;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns empty string
        expect(result).toBe('');
      });

      it('should return original message for unknown errors', () => {
        // GIVEN: Unknown error
        const error = { message: 'Something weird happened' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns original message
        expect(result).toBe('Something weird happened');
      });

      it('should return fallback for undefined message', () => {
        // GIVEN: Error without message
        const error = {} as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Returns fallback message
        expect(result).toBe('An error occurred. Please try again.');
      });

      it('should handle mixed case errors', () => {
        // GIVEN: Mixed case error
        const error = { message: 'INVALID LOGIN CREDENTIALS' } as any;

        // WHEN: Getting error message
        const result = getAuthErrorMessage(error);

        // THEN: Maps correctly (case insensitive)
        expect(result).toBe('Invalid email or password');
      });
    });
  });
});

describe('Auth Error Message Mapping', () => {
  const errorMappings: Array<{ input: string; expected: string }> = [
    { input: 'Invalid login credentials', expected: 'Invalid email or password' },
    { input: 'invalid_credentials', expected: 'Invalid email or password' },
    { input: 'Email not confirmed', expected: 'Please verify your email before signing in' },
    { input: 'User already registered', expected: 'An account with this email already exists' },
    { input: 'already exists in database', expected: 'An account with this email already exists' },
    { input: 'password should be at least 6 characters', expected: 'Password must be at least 8 characters' },
    { input: 'invalid email address', expected: 'Please enter a valid email address' },
    { input: 'network error occurred', expected: 'Unable to connect. Check your internet connection.' },
    { input: 'fetch failed', expected: 'Unable to connect. Check your internet connection.' },
  ];

  test.each(errorMappings)(
    '[P1] should map "$input" to "$expected"',
    ({ input, expected }) => {
      const error = { message: input } as any;
      expect(getAuthErrorMessage(error)).toBe(expected);
    }
  );
});
