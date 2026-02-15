
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = ["/"];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /
 * @type {string[]}
 */
export const authRoutes = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/workspaces";

/**
 * Proxy function that acts as middleware to handle route protection and session handling.
 */
export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Check if session exists by calling the auth server
  let isLoggedIn = false;
  let session = null;

  try {
    const authUrl = new URL("/api/auth/get-session", process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000");
    const response = await fetch(authUrl.toString(), {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });
    
    if (response.ok) {
        session = await response.json();
        isLoggedIn = !!session;
    }
  } catch (error) {
    console.error("Error checking session in middleware:", error);
  }

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.some(route => nextUrl.pathname.startsWith(route));

  // 1. Allow all API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // 2. Handle Auth Routes (sign-in, sign-up)
  if (isAuthRoute) {
    if (isLoggedIn) {
      // Redirect logged-in users away from auth routes
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return NextResponse.next();
  }

  // 3. Handle Private Routes
  if (!isLoggedIn && !isPublicRoute) {
    // Redirect unauthenticated users to sign-in
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }



  // 5. Pass session user info if authenticated (optional, for convenience)
  if (isLoggedIn && session?.user) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user", JSON.stringify(session.user));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
