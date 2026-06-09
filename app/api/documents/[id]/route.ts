import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/session";
import { deleteFromS3 } from "@/lib/s3";
import { getSOPDocument, deleteSOPDocument, deleteSOPChunks } from "@/db/sops";
import { getUserProfile } from "@/db/users";
import { ObjectId } from "mongodb";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/documents/[id] — get a single document
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

        // Employees can only access global docs or docs for their department
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

        return NextResponse.json(doc);
    } catch (error) {
        if (error instanceof Response) return error;
        return NextResponse.json(
            { error: "Failed to fetch document" },
            { status: 500 }
        );
    }
}

// DELETE /api/documents/[id] — delete a document + its chunks + S3 file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();

        const { id } = await params;
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
        }

        const doc = await getSOPDocument(id);

        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Delete from S3
        await deleteFromS3(doc.s3Key);

        // Delete chunks
        await deleteSOPChunks(id);

        // Delete document
        await deleteSOPDocument(id);

        return NextResponse.json({ message: "Document deleted" });
    } catch (error) {
        if (error instanceof Response) return error;
        console.error("Delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete document" },
            { status: 500 }
        );
    }
}
