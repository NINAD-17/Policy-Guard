import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAuditLogs } from "@/db/audits";
import { getUserRole } from "@/db/users";
import { clientPromise } from "@/lib/db";

// GET /api/audit-logs — fetch audit logs
// Admin: all logs (with optional filters). Employee: own logs only. Guest: only logs from current active session.
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isGuest = session.user.email === "guest@policypulse.dev";

        // If guest, run self-clean for old guest logs to ensure they aren't stored long-term
        if (isGuest) {
            try {
                const client = await clientPromise;
                const db = client.db();
                await db.collection("audit_logs").deleteMany({
                    isGuest: true,
                    createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }
                });
            } catch (err) {
                console.error("Failed to clean up old guest logs:", err);
            }
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
        const offset = parseInt(searchParams.get("offset") || "0");
        const status = searchParams.get("status"); // compliant | non_compliant | needs_review
        const tag = searchParams.get("tag");

        const role = await getUserRole(session.user.id);

        // Build filter
        const filter: Record<string, unknown> = {};

        if (isGuest) {
            // Guests can ONLY see logs from their own specific active session
            filter.sessionId = session.session.id;
        } else if (role !== "admin") {
            // Employees can only see their own logs (and never guest logs)
            filter.employeeId = session.user.id;
            filter.isGuest = { $ne: true };
        } else {
            // Admins can see all logs except guest logs
            filter.isGuest = { $ne: true };
        }

        if (status) filter.status = status;
        if (tag) filter.tags = tag;

        const result = await getAuditLogs(filter, limit, offset);

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof Response) return error;
        return NextResponse.json(
            { error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
