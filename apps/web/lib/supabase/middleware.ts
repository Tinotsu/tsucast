import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshing the auth token
  let user = null;
  let isTimeout = false;
  const hasAuthCookies = request.cookies.getAll().some(c => c.name.startsWith('sb-'));

  try {
    const TIMEOUT_MSG = "Auth check timed out";
    let timeoutHandle: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) => {
      timeoutHandle = setTimeout(() => resolve({ data: { user: null }, error: new Error(TIMEOUT_MSG) }), 5000);
    });
    const { data, error } = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise,
    ]);
    clearTimeout(timeoutHandle!);

    if (error || !data.user) {
      isTimeout = error?.message === TIMEOUT_MSG;

      if (isTimeout) {
        // Timeout — do NOT clear cookies. Let client-side auth handle it.
        user = null;
      } else {
        // Real auth failure — clear stale cookies
        if (hasAuthCookies) {
          request.cookies.getAll()
            .filter(c => c.name.startsWith('sb-'))
            .forEach(c => {
              supabaseResponse.cookies.delete(c.name);
            });
        }
        user = null;
      }
    } else {
      user = data.user;
    }
  } catch (error) {
    // If Supabase is unreachable, treat like timeout — don't clear cookies
    console.error("Middleware auth check failed:", error);
    isTimeout = true;
    user = null;
  }

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ["/dashboard", "/library", "/generate", "/upgrade", "/settings"];
  const adminPaths = ["/admin"];
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAdminRoute = adminPaths.some((path) => pathname.startsWith(path));

  if ((isProtectedRoute || isAdminRoute) && !user && !isTimeout) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Admin routes require admin role (on timeout user is null so auth check above handles it)
  if (isAdminRoute && user) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    } catch {
      // Fail closed — deny admin access if profile check fails
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Auth routes - redirect to dashboard if already authenticated
  const authPaths = ["/login", "/signup"];
  const isAuthRoute = authPaths.some((path) => pathname.startsWith(path));

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    const redirect = url.searchParams.get("redirect");

    // Validate redirect to prevent open redirect attacks
    // Must be a relative path starting with / and within allowed routes
    const allowedRedirects = ["/dashboard", "/library", "/generate", "/upgrade", "/settings"];
    const isValidRedirect = redirect &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//") &&
      allowedRedirects.some((path) => redirect.startsWith(path));

    url.pathname = isValidRedirect ? redirect : "/dashboard";
    url.searchParams.delete("redirect");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
