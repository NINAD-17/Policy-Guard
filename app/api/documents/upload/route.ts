import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { createSOPDocument } from "@/db/sops";
import { uploadFile } from "@/lib/storage";
import { inngest } from "@/inngest/client";
import { sopDocumentSchema } from "@/lib/types";
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

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

        if (!file || (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf")) {
            return NextResponse.json(
                { error: "A valid PDF file is required" },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File size exceeds maximum allowed limit of 10MB" },
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

        // Upload PDF to cloud storage (S3 or Cloudinary)
        const buffer = Buffer.from(await file.arrayBuffer());
        const s3Key = `sops/${Date.now()}-${file.name}`;
        await uploadFile(s3Key, buffer);

        // Create document record in MongoDB
        const documentId = await createSOPDocument({
            title: parsed.data.title,
            description: parsed.data.description,
            s3Key,
            scope: parsed.data.scope,
            departments: parsed.data.departments,
            status: "processing",
            uploadedBy: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Trigger Inngest PDF processing pipeline
        await inngest.send({
            name: "sop/document.uploaded",
            data: {
                documentId,
                s3Key,
                scope: parsed.data.scope,
                departments: parsed.data.departments,
            },
        });

        return NextResponse.json(
            {
                message: "Document uploaded, processing started",
                documentId,
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
