"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Headphones, Mail, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } =
    useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  // Display errors from URL params (callback route) or hash fragment (Supabase OAuth)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(urlError);
      return;
    }

    // Supabase OAuth errors come via URL hash fragment
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get("error_description") || hashParams.get("error");
      if (hashError) {
        setError(decodeURIComponent(hashError));
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setIsAppleLoading(true);
    try {
      await signInWithApple();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apple sign in failed");
      setIsAppleLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Logo */}
      <div className="mb-10 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a1a1a]">
            <Headphones className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
            tsucast
          </span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-3 font-normal leading-relaxed text-[#737373]">
          {isLogin
            ? "Sign in to access your podcast library"
            : "Start converting articles to podcasts"}
        </p>
      </div>

      {/* Social Login */}
      <div className="space-y-3">
        <button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isAppleLoading || isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#e5e5e5] bg-white px-4 py-3 font-bold text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continue with Google
        </button>

        <button
          onClick={handleAppleSignIn}
          disabled={isGoogleLoading || isAppleLoading || isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1a1a1a] px-4 py-3 font-bold text-white transition-colors hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAppleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          )}
          Continue with Apple
        </button>
      </div>

      {/* Divider */}
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#e5e5e5]" />
        <span className="text-sm font-normal text-[#737373]">or</span>
        <div className="h-px flex-1 bg-[#e5e5e5]" />
      </div>

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium tracking-tight text-[#1a1a1a]"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a3a3a3]" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-[#e5e5e5] bg-white py-3 pl-10 pr-4 text-[#1a1a1a] placeholder:text-[#a3a3a3] focus:border-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium tracking-tight text-[#1a1a1a]"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a3a3a3]" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Enter your password" : "Min. 8 characters"}
              required
              minLength={8}
              className="w-full rounded-xl border border-[#e5e5e5] bg-white py-3 pl-10 pr-4 text-[#1a1a1a] placeholder:text-[#a3a3a3] focus:border-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>

        {!isLogin && (
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium tracking-tight text-[#1a1a1a]"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a3a3a3]" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={8}
                className="w-full rounded-xl border border-[#e5e5e5] bg-white py-3 pl-10 pr-4 text-[#1a1a1a] placeholder:text-[#a3a3a3] focus:border-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading || isAppleLoading}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition-colors",
            "bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {isLogin ? "Signing in..." : "Creating account..."}
            </>
          ) : isLogin ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-sm font-normal leading-relaxed text-[#737373]">
        {isLogin ? (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-[#1a1a1a] underline hover:text-[#1a1a1a]"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#1a1a1a] underline hover:text-[#1a1a1a]"
            >
              Sign in
            </Link>
          </>
        )}
      </p>

      {/* Legal Links (App Store requirement) */}
      {!isLogin && (
        <p className="mt-4 text-center text-xs font-normal leading-relaxed text-[#737373]">
          By signing up, you agree to our{" "}
          <a
            href="https://tsucast.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#737373] underline hover:text-[#1a1a1a]"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://tsucast.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#737373] underline hover:text-[#1a1a1a]"
          >
            Privacy Policy
          </a>
        </p>
      )}
    </div>
  );
}
