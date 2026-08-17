import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getFileUrl } from "@/lib/storage";
import { getSOPDocument } from "@/db/sops";
import { getUserProfile } from "@/db/users";
import { ObjectId } from "mongodb";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/documents/[id]/url — generate a presigned URL for viewing the PDF
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireSession();

        const { id } = await params;
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
        }

        const doc = await getSOPDocument(id);

        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        if (!doc.s3Key) {
            return NextResponse.json({ error: "Document file key missing" }, { status: 404 });
        }

        // Scope-based access check for employees
        const profile = await getUserProfile(session.user.id);
        const role = profile?.role;
        const department = profile?.department || "Unknown";
        const isGuest = session.user.email === "guest@policypulse.dev";

        if (role !== "admin" && !isGuest) {
            const canAccess =
                doc.scope === "global" ||
                doc.departments?.includes(department);

            if (!canAccess) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const url = await getFileUrl(doc.s3Key);

        return NextResponse.json({ url, expiresIn: 3600 });
    } catch (error) {
        if (error instanceof Response) return error;
        return NextResponse.json(
            { error: "Failed to generate URL" },
            { status: 500 }
        );
    }
}
