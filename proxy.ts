import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "./lib/auth";

const protectedRoutes = [
  // "/dashboard",
  "/interns",
  "/supervisors",
  "/admin",
  "/documents",
  "/logbook",
  "/attendance",
  "/guidance",
  "/assessments",
  "/reports",
];

const authRoutes = ["/sign-in"];

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (isProtectedRoute && !session) {
    const signInUrl = new URL("/sign-in", request.nextUrl.origin);
    signInUrl.searchParams.set("redirect", path);

    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
