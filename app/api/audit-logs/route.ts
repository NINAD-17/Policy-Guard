import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAuditLogs } from "@/db/audits";
import { getUserRole } from "@/db/users";

// GET /api/audit-logs — fetch audit logs
// Admin: all logs (with optional filters). Employee: own logs only.
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
        const offset = parseInt(searchParams.get("offset") || "0");
        const status = searchParams.get("status"); // compliant | non_compliant | needs_review
        const tag = searchParams.get("tag");

        const role = await getUserRole(session.user.id);

        // Build filter
        const filter: Record<string, unknown> = {};

        // Employees can only see their own logs
        if (role !== "admin") {
            filter.employeeId = session.user.id;
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
