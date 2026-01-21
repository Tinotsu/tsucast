/**
 * Auth Form Validation Tests
 *
 * Tests for form validation logic used in login.tsx and signup.tsx
 * Story: 1-1 Email Registration & Login (AC2, AC3, AC4)
 */

// Email validation regex used in login/signup screens
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password minimum length
const MIN_PASSWORD_LENGTH = 8;

describe('Email Validation', () => {
  const isValidEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email.trim());
  };

  describe('valid emails', () => {
    it('should accept standard email format', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('should accept email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
    });

    it('should accept email with dots in local part', () => {
      expect(isValidEmail('first.last@example.com')).toBe(true);
    });

    it('should accept email with plus sign', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should accept email with numbers', () => {
      expect(isValidEmail('user123@example.com')).toBe(true);
    });

    it('should handle trimmed whitespace', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('invalid emails', () => {
    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should reject email without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should reject email with spaces in middle', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
    });

    it('should reject email with multiple @', () => {
      expect(isValidEmail('user@@example.com')).toBe(false);
    });

    it('should reject email without TLD', () => {
      expect(isValidEmail('user@example')).toBe(false);
    });
  });
});

describe('Password Validation', () => {
  const isValidPassword = (password: string): boolean => {
    return password.length >= MIN_PASSWORD_LENGTH;
  };

  describe('valid passwords', () => {
    it('should accept password with exactly 8 characters', () => {
      expect(isValidPassword('12345678')).toBe(true);
    });

    it('should accept password with more than 8 characters', () => {
      expect(isValidPassword('mysecurepassword123')).toBe(true);
    });

    it('should accept password with special characters', () => {
      expect(isValidPassword('P@ssw0rd!')).toBe(true);
    });

    it('should accept password with spaces', () => {
      expect(isValidPassword('my password')).toBe(true);
    });
  });

  describe('invalid passwords', () => {
    it('should reject empty password', () => {
      expect(isValidPassword('')).toBe(false);
    });

    it('should reject password with 7 characters', () => {
      expect(isValidPassword('1234567')).toBe(false);
    });

    it('should reject password with only 7 spaces', () => {
      expect(isValidPassword('       ')).toBe(false); // 7 spaces = not valid
    });

    it('should accept password with 8 spaces (length check only)', () => {
      expect(isValidPassword('        ')).toBe(true); // 8 spaces = valid (length check only)
    });
  });
});

describe('Login Form Validation', () => {
  interface ValidationResult {
    isValid: boolean;
    error?: string;
  }

  const validateLoginForm = (email: string, password: string): ValidationResult => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return { isValid: false, error: 'Please enter your email' };
    }

    if (!password) {
      return { isValid: false, error: 'Please enter your password' };
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
  };

  it('should pass with valid email and password', () => {
    const result = validateLoginForm('user@example.com', 'password123');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail with empty email', () => {
    const result = validateLoginForm('', 'password123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter your email');
  });

  it('should fail with whitespace-only email', () => {
    const result = validateLoginForm('   ', 'password123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter your email');
  });

  it('should fail with empty password', () => {
    const result = validateLoginForm('user@example.com', '');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter your password');
  });

  it('should fail with invalid email format', () => {
    const result = validateLoginForm('invalid-email', 'password123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a valid email address');
  });

  it('should validate email check before format check', () => {
    // Empty email should return "enter your email" not "invalid format"
    const result = validateLoginForm('', 'password123');
    expect(result.error).toBe('Please enter your email');
  });
});

describe('Signup Form Validation', () => {
  interface ValidationResult {
    isValid: boolean;
    error?: string;
  }

  const validateSignupForm = (email: string, password: string): ValidationResult => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return { isValid: false, error: 'Please enter your email' };
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    if (!password) {
      return { isValid: false, error: 'Please enter a password' };
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return { isValid: false, error: 'Password must be at least 8 characters' };
    }

    return { isValid: true };
  };

  it('should pass with valid email and password', () => {
    const result = validateSignupForm('user@example.com', 'password123');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail with empty email', () => {
    const result = validateSignupForm('', 'password123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter your email');
  });

  it('should fail with invalid email format', () => {
    const result = validateSignupForm('invalid-email', 'password123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a valid email address');
  });

  it('should fail with empty password', () => {
    const result = validateSignupForm('user@example.com', '');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a password');
  });

  it('should fail with password less than 8 characters', () => {
    const result = validateSignupForm('user@example.com', '1234567');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters');
  });

  it('should pass with password exactly 8 characters', () => {
    const result = validateSignupForm('user@example.com', '12345678');
    expect(result.isValid).toBe(true);
  });
});
