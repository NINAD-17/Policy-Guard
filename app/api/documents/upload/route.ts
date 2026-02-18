import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { clientPromise } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { inngest } from "@/inngest/client";
import { COLLECTIONS, sopDocumentSchema } from "@/lib/types";
import type { SOPDocument } from "@/lib/types";

// POST /api/documents/upload — upload PDF + create document + trigger processing
export async function POST(request: NextRequest) {
    try {
        const session = await requireAdmin();

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const scope = formData.get("scope") as string;
        const departmentsRaw = formData.get("departments") as string;

        if (!file || !file.name.endsWith(".pdf")) {
            return NextResponse.json(
                { error: "A PDF file is required" },
                { status: 400 }
            );
        }

        // Parse departments from comma-separated string
        const departments = departmentsRaw
            ? departmentsRaw.split(",").map((d) => d.trim()).filter(Boolean)
            : [];

        // Validate metadata
        const parsed = sopDocumentSchema.safeParse({
            title,
            description,
            scope,
            departments,
        });

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten() },
                { status: 400 }
            );
        }

        // Upload PDF to S3
        const buffer = Buffer.from(await file.arrayBuffer());
        const s3Key = `sops/${Date.now()}-${file.name}`;
        await uploadToS3(s3Key, buffer);

        // Create document record in MongoDB
        const client = await clientPromise;
        const db = client.db();

        const doc: SOPDocument = {
            title: parsed.data.title,
            description: parsed.data.description,
            s3Key,
            scope: parsed.data.scope,
            departments: parsed.data.departments,
            status: "processing",
            uploadedBy: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db
            .collection(COLLECTIONS.SOP_DOCUMENTS)
            .insertOne(doc);

        // Trigger Inngest PDF processing pipeline
        await inngest.send({
            name: "sop/document.uploaded",
            data: {
                documentId: result.insertedId.toString(),
                s3Key,
                scope: parsed.data.scope,
                departments: parsed.data.departments,
            },
        });

        return NextResponse.json(
            {
                message: "Document uploaded, processing started",
                documentId: result.insertedId,
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof Response) return error;
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload document" },
            { status: 500 }
        );
    }
}
