import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { clientPromise } from "@/lib/db";
import { COLLECTIONS } from "@/lib/types";

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

        const client = await clientPromise;
        const db = client.db();

        // Build filter
        const filter: Record<string, unknown> = {};

        // Employees can only see their own logs
        if (session.user.role !== "admin") {
            filter.employeeId = session.user.id;
        }

        if (status) filter.status = status;
        if (tag) filter.tags = tag;

        const [logs, total] = await Promise.all([
            db
                .collection(COLLECTIONS.AUDIT_LOGS)
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .toArray(),
            db.collection(COLLECTIONS.AUDIT_LOGS).countDocuments(filter),
        ]);

        return NextResponse.json({ logs, total, limit, offset });
    } catch (error) {
        if (error instanceof Response) return error;
        return NextResponse.json(
            { error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
