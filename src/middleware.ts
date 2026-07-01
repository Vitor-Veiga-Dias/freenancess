import { NextRequest, NextResponse } from "next/server";

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/health",
  "/api/locale",
];

const protectedPrefixes = [
  "/overview",
  "/entries",
  "/feed",
  "/flows",
  "/connections",
  "/sandbox",
  "/personal",
  "/business",
  "/api/open-finance",
  "/api/entries",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("better-auth.session_token");

  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
