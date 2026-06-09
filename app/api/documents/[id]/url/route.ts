import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPresignedUrl } from "@/lib/s3";
import { getSOPDocument } from "@/db/sops";
import { getUserProfile } from "@/db/users";
import { ObjectId } from "mongodb";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/documents/[id]/url — generate a presigned URL for viewing the PDF
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
        }

        const doc = await getSOPDocument(id);

        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Scope-based access check for employees
        const profile = await getUserProfile(session.user.id);
        const role = profile?.role;
        const department = profile?.department || "Unknown";

        if (role !== "admin") {
            const canAccess =
                doc.scope === "global" ||
                doc.departments?.includes(department);

            if (!canAccess) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const url = await getPresignedUrl(doc.s3Key);

        return NextResponse.json({ url, expiresIn: 3600 });
    } catch (error) {
        if (error instanceof Response) return error;
        return NextResponse.json(
            { error: "Failed to generate URL" },
            { status: 500 }
        );
    }
}
