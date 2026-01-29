import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const origin = requestUrl.origin;

  // Handle OAuth error responses from Supabase
  if (error) {
    const params = new URLSearchParams({
      error: errorDescription || error,
    });
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        const params = new URLSearchParams({
          error: exchangeError.message,
        });
        return NextResponse.redirect(`${origin}/login?${params.toString()}`);
      }
    } catch {
      const params = new URLSearchParams({
        error: "Authentication failed. Please try again.",
      });
      return NextResponse.redirect(`${origin}/login?${params.toString()}`);
    }
  }

  // Redirect to home after successful auth
  return NextResponse.redirect(`${origin}/home`);
}
