import { AuthForm } from "@/components/auth/AuthForm";
import type { Metadata } from "next";

// Force dynamic rendering since AuthForm uses useSearchParams
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In - tsucast",
  description: "Sign in to your tsucast account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <AuthForm mode="login" />
    </div>
  );
}
