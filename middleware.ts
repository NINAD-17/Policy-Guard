import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes that don't require authentication
const publicRoutes = ["/login", "/api/auth"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes and API routes (except auth-protected ones handled in route handlers)
    const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
    );
    const isApiRoute = pathname.startsWith("/api/");

    if (isPublicRoute || isApiRoute) {
        return NextResponse.next();
    }

    // Check for session cookie
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
        // Not authenticated → redirect to login
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all routes except static files and Next.js internals
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
