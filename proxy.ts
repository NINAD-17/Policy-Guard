import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/admin", "/dashboard"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get the session token from cookies
    // better-auth uses "better-auth.session_token" in dev (http),
    // and "__Secure-better-auth.session_token" in production (https)
    const sessionToken =
        request.cookies.get("better-auth.session_token")?.value ||
        request.cookies.get("__Secure-better-auth.session_token")?.value;

    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Redirect to landing page with login modal if accessing protected route without session
    if (isProtectedRoute && !sessionToken) {
        const loginUrl = new URL("/", request.url);
        loginUrl.searchParams.set("login", "true");
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// Only run on page routes, not API routes or static files
export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
    ],
};
