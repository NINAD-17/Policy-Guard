import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getSOPDocuments } from "@/db/sops";
import { getUserProfile } from "@/db/users";

// GET /api/documents — list documents
// Admin: all documents. Employee: global + own department docs
export async function GET() {
    try {
        const session = await requireSession();

        const profile = await getUserProfile(session.user.id);
        const role = profile?.role;

        let filter = {};
        if (role !== "admin") {
            // Employees can only see global docs or docs matching their department
            filter = {
                $or: [
                    { scope: "global" },
                    { departments: profile?.department || "Unknown" },
                ],
            };
        }

        const documents = await getSOPDocuments(filter);

        return NextResponse.json(documents);
    } catch (error) {
        if (error instanceof Response) return error;
        return NextResponse.json(
            { error: "Failed to fetch documents" },
            { status: 500 }
        );
    }
}
