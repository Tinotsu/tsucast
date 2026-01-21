import { AuthForm } from "@/components/auth/AuthForm";
import type { Metadata } from "next";

// Force dynamic rendering since AuthForm uses useSearchParams
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Account - tsucast",
  description: "Create your tsucast account and start converting articles to podcasts",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <AuthForm mode="signup" />
    </div>
  );
}
