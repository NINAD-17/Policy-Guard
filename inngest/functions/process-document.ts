import { inngest } from "../client";
import { clientPromise } from "@/lib/db";
import { downloadFromS3 } from "@/lib/s3";
import { generateEmbeddings } from "@/lib/embeddings";
import { insertSOPChunks, updateSOPDocument } from "@/db/sops";
import { COLLECTIONS } from "@/lib/types";
import type { SOPChunk } from "@/lib/types";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ObjectId } from "mongodb";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Inngest function: process-document
 *
 * Triggered after a new SOP PDF is uploaded. Pipeline:
 * 1. Download PDF from S3
 * 2. Extract text (LangChain PDFLoader)
 * 3. Split into chunks (RecursiveCharacterTextSplitter)
 * 4. Generate Gemini embeddings for each chunk
 * 5. Store chunks + embeddings in sop_chunks collection
 * 6. Update document status to "active"
 */
export const processDocument = inngest.createFunction(
    {
        id: "process-document",
        retries: 2,
    },
    { event: "sop/document.uploaded" },
    async ({ event, step }) => {
        const { documentId, s3Key, scope, departments } = event.data;

        // Step 1: Download PDF from S3
        const pdfBuffer = await step.run("download-pdf", async () => {
            const buffer = await downloadFromS3(s3Key);
            return buffer.toString("base64"); // serialize for step output
        });

        // Step 2: Extract text and split into chunks
        const chunks = await step.run("extract-and-split", async () => {
            const buffer = Buffer.from(pdfBuffer, "base64");
            const tempPath = join(tmpdir(), `sop-${documentId}-${Date.now()}.pdf`);
            await writeFile(tempPath, buffer);

            try {
                const loader = new PDFLoader(tempPath);
                // docs will have { pageContent: string, metadata: { loc: { pageNumber: 1 }, ... } }
                const docs = await loader.load();

                // Guard: if PDF had no extractable text, return empty
                if (!docs || docs.length === 0 || !docs.some(d => d.pageContent.trim().length > 0)) {
                    return [];
                }

                // Split documents while preserving metadata
                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: 1000,
                    chunkOverlap: 200,
                });
                const splitDocs = await splitter.splitDocuments(docs);
                
                // Return serializable array
                return splitDocs.map(doc => ({
                    pageContent: doc.pageContent,
                    pageNumber: doc.metadata?.loc?.pageNumber || doc.metadata?.page || 1, // langchain PDFLoader puts it in loc.pageNumber (1-indexed)
                }));
            } finally {
                await unlink(tempPath).catch(() => { });
            }
        });

        // Guard: if PDF had no extractable text, mark as failed and stop
        if (!chunks || chunks.length === 0) {
            await step.run("mark-failed", async () => {
                await updateSOPDocument(documentId, { status: "failed", updatedAt: new Date() });
            });
            return { documentId, error: "No extractable text found in PDF" };
        }

        // Step 3: Generate embeddings (batch - langchain handles it)
        const embeddings = await step.run("generate-embeddings", async () => {
            return generateEmbeddings(chunks.map(c => c.pageContent));
        });

        // Step 4: Store chunks in MongoDB
        await step.run("store-chunks", async () => {
            const sopChunks: Omit<SOPChunk, "_id">[] = chunks.map((chunk, index) => ({
                documentId: new ObjectId(documentId),
                content: chunk.pageContent,
                chunkIndex: index,
                pageNumber: chunk.pageNumber,
                embedding: embeddings[index],
                scope,
                departments,
            }));

            await insertSOPChunks(sopChunks);
        });

        // Step 5: Mark document as active
        await step.run("activate-document", async () => {
            await updateSOPDocument(documentId, { status: "active", updatedAt: new Date() });
        });

        return {
            documentId,
            chunksCreated: chunks.length,
            status: "active",
        };
    }
);
