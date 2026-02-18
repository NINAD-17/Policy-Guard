import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/session";
import { clientPromise } from "@/lib/db";
import { deleteFromS3 } from "@/lib/s3";
import { COLLECTIONS } from "@/lib/types";
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

        const client = await clientPromise;
        const db = client.db();

        const doc = await db
            .collection(COLLECTIONS.SOP_DOCUMENTS)
            .findOne({ _id: new ObjectId(id) });

        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Employees can only access global docs or docs for their department
        if (session.user.role !== "admin") {
            const canAccess =
                doc.scope === "global" ||
                doc.departments?.includes(session.user.department);

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

        const client = await clientPromise;
        const db = client.db();

        const doc = await db
            .collection(COLLECTIONS.SOP_DOCUMENTS)
            .findOne({ _id: new ObjectId(id) });

        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Delete from S3
        await deleteFromS3(doc.s3Key);

        // Delete chunks
        await db
            .collection(COLLECTIONS.SOP_CHUNKS)
            .deleteMany({ documentId: new ObjectId(id) });

        // Delete document
        await db
            .collection(COLLECTIONS.SOP_DOCUMENTS)
            .deleteOne({ _id: new ObjectId(id) });

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
