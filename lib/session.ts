import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserRole } from "@/db/users";

/**
 * Get the current session from the request.
 * Returns null if not authenticated.
 */
export async function getSession() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return session;
}

/**
 * Get session or throw 401. Use in API routes that require auth.
 */
export async function requireSession() {
    const session = await getSession();
    if (!session) {
        throw new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    return session;
}

/**
 * Check if current user is admin. Throws 403 if not.
 */
export async function requireAdmin() {
    const session = await requireSession();
    const role = await getUserRole(session.user.id);
    if (role !== "admin") {
        throw new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }
    return session;
}
