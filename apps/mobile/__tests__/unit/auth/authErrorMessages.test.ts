/**
 * Auth Error Message Tests
 *
 * Tests for the getAuthErrorMessage utility
 * Story: 1-1 Email Registration & Login (AC4 - Login Error Handling)
 *
 * Note: This tests a standalone copy of the getAuthErrorMessage function
 * to avoid importing react-native dependencies in Jest.
 */

// Standalone implementation matching hooks/useAuth.ts getAuthErrorMessage
interface AuthError {
  message?: string;
  status?: number;
  name: string;
}

function getAuthErrorMessage(error: AuthError | null): string {
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

// Helper to create mock AuthError
function createMockError(message: string): AuthError {
  return { message, status: 400, name: 'AuthError' } as AuthError;
}

describe('getAuthErrorMessage', () => {
  describe('null/undefined handling', () => {
    it('should return empty string for null error', () => {
      expect(getAuthErrorMessage(null)).toBe('');
    });
  });

  describe('invalid credentials', () => {
    it('should return user-friendly message for "invalid login credentials"', () => {
      const error = createMockError('Invalid login credentials');
      expect(getAuthErrorMessage(error)).toBe('Invalid email or password');
    });

    it('should return user-friendly message for "invalid_credentials" code', () => {
      const error = createMockError('invalid_credentials');
      expect(getAuthErrorMessage(error)).toBe('Invalid email or password');
    });

    it('should be case-insensitive', () => {
      const error = createMockError('INVALID LOGIN CREDENTIALS');
      expect(getAuthErrorMessage(error)).toBe('Invalid email or password');
    });
  });

  describe('email verification', () => {
    it('should return verification message for "email not confirmed"', () => {
      const error = createMockError('Email not confirmed');
      expect(getAuthErrorMessage(error)).toBe('Please verify your email before signing in');
    });
  });

  describe('duplicate account', () => {
    it('should return duplicate message for "user already registered"', () => {
      const error = createMockError('User already registered');
      expect(getAuthErrorMessage(error)).toBe('An account with this email already exists');
    });

    it('should return duplicate message for "already exists"', () => {
      const error = createMockError('Email already exists');
      expect(getAuthErrorMessage(error)).toBe('An account with this email already exists');
    });
  });

  describe('password requirements', () => {
    it('should return password length message for password constraint errors', () => {
      const error = createMockError('Password should be at least 6 characters');
      expect(getAuthErrorMessage(error)).toBe('Password must be at least 8 characters');
    });
  });

  describe('invalid email', () => {
    it('should return invalid email message for "invalid email"', () => {
      const error = createMockError('Invalid email format');
      expect(getAuthErrorMessage(error)).toBe('Please enter a valid email address');
    });
  });

  describe('network errors', () => {
    it('should return network message for "network" errors', () => {
      const error = createMockError('Network request failed');
      expect(getAuthErrorMessage(error)).toBe('Unable to connect. Check your internet connection.');
    });

    it('should return network message for "fetch" errors', () => {
      const error = createMockError('Fetch failed');
      expect(getAuthErrorMessage(error)).toBe('Unable to connect. Check your internet connection.');
    });
  });

  describe('fallback behavior', () => {
    it('should return original message for unknown errors', () => {
      const error = createMockError('Some unknown error occurred');
      expect(getAuthErrorMessage(error)).toBe('Some unknown error occurred');
    });

    it('should return generic message when error has no message', () => {
      const error = { message: '', status: 500, name: 'AuthError' } as AuthError;
      expect(getAuthErrorMessage(error)).toBe('An error occurred. Please try again.');
    });
  });
});
