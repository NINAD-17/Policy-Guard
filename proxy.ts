import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/admin", "/dashboard"];

// Routes that are only for non-authenticated users
const authRoutes = ["/login"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get the session token from cookies
    // better-auth uses this cookie name by default
    const sessionToken = request.cookies.get(
        "better-auth.session_token"
    )?.value;

    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Redirect to login if accessing protected route without session
    if (isProtectedRoute && !sessionToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard if accessing auth routes with active session
    if (isAuthRoute && sessionToken) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

// Only run on page routes, not API routes or static files
export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
    ],
};
