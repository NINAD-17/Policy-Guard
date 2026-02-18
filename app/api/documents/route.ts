import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { clientPromise } from "@/lib/db";
import { COLLECTIONS } from "@/lib/types";

// GET /api/documents — list documents
// Admin: all documents. Employee: global + own department docs
export async function GET() {
    try {
        const session = await requireSession();

        const client = await clientPromise;
        const db = client.db();

        let filter = {};
        if (session.user.role !== "admin") {
            filter = {
                $or: [
                    { scope: "global" },
                    { departments: session.user.department },
                ],
            };
        }

        const documents = await db
            .collection(COLLECTIONS.SOP_DOCUMENTS)
            .find(filter)
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json(documents);
    } catch (error) {
        if (error instanceof Response) return error;
        return NextResponse.json(
            { error: "Failed to fetch documents" },
            { status: 500 }
        );
    }
}
