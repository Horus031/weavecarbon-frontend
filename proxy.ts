import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales, type Locale } from "./lib/i18n/config";

export async function proxy(request: NextRequest) {
  // ============================================
  // 1. Handle i18n Locale (from cookie, no URL prefix)
  // ============================================
  const localeCookie = request.cookies.get("locale")?.value;

  // Validate locale
  const locale: Locale = locales.includes(localeCookie as Locale)
    ? (localeCookie as Locale)
    : defaultLocale;

  // ============================================
  // 2. Handle Supabase Auth
  // ============================================
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
        setAll(cookiesToSet) {
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

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser();

  // ============================================
  // 3. Set locale cookie if not exists
  // ============================================
  if (!localeCookie) {
    supabaseResponse.cookies.set("locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  // ============================================
  // 4. Optional: Protected routes logic
  // ============================================
  // const { data: { user } } = await supabase.auth.getUser();
  // const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
  // 
  // if (isProtectedRoute && !user) {
  //   return NextResponse.redirect(new URL("/auth/login", request.url));
  // }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
