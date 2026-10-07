import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedRoutes = ["/hr", "/intern", "/supervisor", "/admin"];

const authRoutes = ["/sign-in"];

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

  const sessionCookie = getSessionCookie(request);

  if (isProtectedRoute && !sessionCookie) {
    const signInUrl = new URL("/sign-in", request.nextUrl.origin);
    signInUrl.searchParams.set("redirect", path);

    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && sessionCookie) {
    // Proxy hanya tahu keberadaan cookie, bukan role user — biarkan lewat
    // agar server component /sign-in yang memutuskan tujuan berbasis role.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
