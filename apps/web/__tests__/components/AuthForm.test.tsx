/**
 * Component Tests: AuthForm
 *
 * Tests for the authentication form component (login/signup).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthForm } from "@/components/auth/AuthForm";

// Mock useAuth hook
const mockSignInWithEmail = vi.fn();
const mockSignUpWithEmail = vi.fn();
const mockSignInWithGoogle = vi.fn();
const mockSignInWithApple = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    signInWithEmail: mockSignInWithEmail,
    signUpWithEmail: mockSignUpWithEmail,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithApple: mockSignInWithApple,
  }),
}));

// Mock useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useTheme hook
const mockSetTheme = vi.fn();
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: mockSetTheme,
  }),
}));

describe("AuthForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Login Mode", () => {
    it("[P1] should render login form", () => {
      // GIVEN: AuthForm in login mode
      // WHEN: Rendering component
      render(<AuthForm mode="login" />);

      // THEN: Login elements are displayed
      expect(screen.getByText("Welcome back")).toBeInTheDocument();
      expect(screen.getByText("Sign in to access your podcast library")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("[P1] should render email and password fields", () => {
      // GIVEN: AuthForm in login mode
      // WHEN: Rendering component
      render(<AuthForm mode="login" />);

      // THEN: Email and password inputs exist
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it("[P1] should not render confirm password in login mode", () => {
      // GIVEN: AuthForm in login mode
      // WHEN: Rendering component
      render(<AuthForm mode="login" />);

      // THEN: No confirm password field
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
    });

    it("[P1] should call signInWithEmail on form submit", async () => {
      // GIVEN: Login form with credentials
      mockSignInWithEmail.mockResolvedValue({});
      render(<AuthForm mode="login" />);

      // WHEN: Filling and submitting form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      // THEN: signInWithEmail is called
      await waitFor(() => {
        expect(mockSignInWithEmail).toHaveBeenCalledWith("test@example.com", "password123");
      });
    });

    it("[P1] should show link to signup", () => {
      // GIVEN: AuthForm in login mode
      // WHEN: Rendering component
      render(<AuthForm mode="login" />);

      // THEN: Link to signup is shown
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
    });
  });

  describe("Signup Mode", () => {
    it("[P1] should render signup form", () => {
      // GIVEN: AuthForm in signup mode
      // WHEN: Rendering component
      render(<AuthForm mode="signup" />);

      // THEN: Signup elements are displayed
      expect(screen.getByText("Create your account")).toBeInTheDocument();
      expect(screen.getByText("Start converting articles to podcasts")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    });

    it("[P1] should render confirm password field in signup mode", () => {
      // GIVEN: AuthForm in signup mode
      // WHEN: Rendering component
      render(<AuthForm mode="signup" />);

      // THEN: Confirm password field exists
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it("[P1] should validate password match", async () => {
      // GIVEN: Signup form with mismatched passwords
      render(<AuthForm mode="signup" />);

      // WHEN: Filling form with mismatched passwords
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "different" },
      });
      fireEvent.click(screen.getByRole("button", { name: /create account/i }));

      // THEN: Error is shown
      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      });
      expect(mockSignUpWithEmail).not.toHaveBeenCalled();
    });

    it("[P1] should validate minimum password length", async () => {
      // GIVEN: Signup form with short password
      render(<AuthForm mode="signup" />);

      // WHEN: Filling form with short password
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "short" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "short" },
      });
      fireEvent.click(screen.getByRole("button", { name: /create account/i }));

      // THEN: Error is shown
      await waitFor(() => {
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      });
      expect(mockSignUpWithEmail).not.toHaveBeenCalled();
    });

    it("[P1] should call signUpWithEmail on valid form submit", async () => {
      // GIVEN: Signup form with valid credentials
      mockSignUpWithEmail.mockResolvedValue({});
      render(<AuthForm mode="signup" />);

      // WHEN: Filling and submitting form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /create account/i }));

      // THEN: signUpWithEmail is called
      await waitFor(() => {
        expect(mockSignUpWithEmail).toHaveBeenCalledWith("test@example.com", "password123");
      });
    });

    it("[P1] should show link to login", () => {
      // GIVEN: AuthForm in signup mode
      // WHEN: Rendering component
      render(<AuthForm mode="signup" />);

      // THEN: Link to login is shown
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe("Social Login", () => {
    it("[P1] should render Google sign in button", () => {
      // GIVEN: AuthForm component
      // WHEN: Rendering component
      render(<AuthForm mode="login" />);

      // THEN: Google button exists
      expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
    });

    it("[P1] should render Apple sign in button", () => {
      // GIVEN: AuthForm component
      // WHEN: Rendering component
      render(<AuthForm mode="login" />);

      // THEN: Apple button exists
      expect(screen.getByRole("button", { name: /apple/i })).toBeInTheDocument();
    });

    it("[P1] should call signInWithGoogle on Google button click", async () => {
      // GIVEN: AuthForm with Google sign in mock
      mockSignInWithGoogle.mockResolvedValue({});
      render(<AuthForm mode="login" />);

      // WHEN: Clicking Google button
      fireEvent.click(screen.getByRole("button", { name: /google/i }));

      // THEN: signInWithGoogle is called
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it("[P1] should call signInWithApple on Apple button click", async () => {
      // GIVEN: AuthForm with Apple sign in mock
      mockSignInWithApple.mockResolvedValue({});
      render(<AuthForm mode="login" />);

      // WHEN: Clicking Apple button
      fireEvent.click(screen.getByRole("button", { name: /apple/i }));

      // THEN: signInWithApple is called
      await waitFor(() => {
        expect(mockSignInWithApple).toHaveBeenCalled();
      });
    });
  });

  describe("URL Error Display", () => {
    it("[P1] should display error from URL hash fragment", () => {
      // GIVEN: URL has error in hash fragment (Supabase OAuth error)
      const originalHash = window.location.hash;
      Object.defineProperty(window, "location", {
        value: { ...window.location, hash: "#error=server_error&error_description=OAuth+failed" },
        writable: true,
      });

      // WHEN: Rendering component
      render(<AuthForm mode="login" />);

      // THEN: Error from hash is displayed
      expect(screen.getByText("OAuth failed")).toBeInTheDocument();

      // Cleanup
      Object.defineProperty(window, "location", {
        value: { ...window.location, hash: originalHash },
        writable: true,
      });
    });
  });

  describe("Error Handling", () => {
    it("[P1] should display error message on auth failure", async () => {
      // GIVEN: Sign in that fails
      mockSignInWithEmail.mockRejectedValue(new Error("Invalid credentials"));
      render(<AuthForm mode="login" />);

      // WHEN: Submitting form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "wrongpassword" },
      });
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      // THEN: Error message is displayed
      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("[P2] should display generic error for non-Error throws", async () => {
      // GIVEN: Sign in that throws non-Error
      mockSignInWithGoogle.mockRejectedValue("Unknown error");
      render(<AuthForm mode="login" />);

      // WHEN: Clicking Google button
      fireEvent.click(screen.getByRole("button", { name: /google/i }));

      // THEN: Generic error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/google sign in failed/i)).toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("[P1] should show loading state during email submit", async () => {
      // GIVEN: Sign in that takes time
      mockSignInWithEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      render(<AuthForm mode="login" />);

      // WHEN: Submitting form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      // THEN: Loading text is shown
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });

    it("[P2] should disable buttons during loading", async () => {
      // GIVEN: Sign in that takes time
      mockSignInWithEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      render(<AuthForm mode="login" />);

      // WHEN: Submitting form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      // THEN: All auth buttons are disabled
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /google/i })).toBeDisabled();
        expect(screen.getByRole("button", { name: /apple/i })).toBeDisabled();
      });
    });
  });

  describe("Navigation", () => {
    it("[P1] should redirect after successful login", async () => {
      // GIVEN: Successful sign in
      mockSignInWithEmail.mockResolvedValue({});
      render(<AuthForm mode="login" />);

      // WHEN: Submitting form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      // THEN: Router push is called
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });
  });

  describe("Logo", () => {
    it("[P2] should render tsucast logo", () => {
      // GIVEN: AuthForm component
      // WHEN: Rendering component
      render(<AuthForm mode="login" />);

      // THEN: Logo text is shown
      expect(screen.getByText("tsucast")).toBeInTheDocument();
    });

    it("[P2] should have logo link to home", () => {
      // GIVEN: AuthForm component
      // WHEN: Rendering component
      render(<AuthForm mode="login" />);

      // THEN: Logo links to home
      const logoLink = screen.getByText("tsucast").closest("a");
      expect(logoLink).toHaveAttribute("href", "/");
    });
  });
});
