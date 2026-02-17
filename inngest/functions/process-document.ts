import { inngest } from "../client";
import { clientPromise } from "@/lib/db";
import { downloadFromS3 } from "@/lib/s3";
import { generateEmbeddings } from "@/lib/embeddings";
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

        // Step 2: Extract text from PDF
        const rawText = await step.run("extract-text", async () => {
            const buffer = Buffer.from(pdfBuffer, "base64"); // Convert the base64 string back to raw bytes

            // PDFLoader (fs) expects a file path, so write buffer to a temp file
            const tempPath = join(tmpdir(), `sop-${documentId}-${Date.now()}.pdf`);
            await writeFile(tempPath, buffer);

            try {
                const loader = new PDFLoader(tempPath);
                
                // loader.load() returns one Document per page: [{ pageContent: "...", metadata: { page: 0 } }]
                const docs = await loader.load();
                
                // Extract just the text from each page and join with double newlines (["page 1 text", "page 2 text"] → "page 1 text\n\npage 2 text")
                return docs.map((doc) => doc.pageContent).join("\n\n");
            } finally {
                // Clean up temp file whether extraction succeeds or fails
                await unlink(tempPath).catch(() => { });
            }
        });

        // Step 3: Split into chunks
        const chunks = await step.run("split-chunks", async () => {
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });
            return splitter.splitText(rawText);
        });

        // Step 4: Generate embeddings (batch - langchain handles it)
        const embeddings = await step.run("generate-embeddings", async () => {
            return generateEmbeddings(chunks);
        });

        // Step 5: Store chunks in MongoDB
        await step.run("store-chunks", async () => {
            const client = await clientPromise;
            const db = client.db();

            const sopChunks: SOPChunk[] = chunks.map((content, index) => ({
                documentId: new ObjectId(documentId),
                content,
                chunkIndex: index,
                embedding: embeddings[index],
                scope,
                departments,
            }));

            await db.collection(COLLECTIONS.SOP_CHUNKS).insertMany(sopChunks);
        });

        // Step 6: Mark document as active
        await step.run("activate-document", async () => {
            const client = await clientPromise;
            const db = client.db();

            await db.collection(COLLECTIONS.SOP_DOCUMENTS).updateOne(
                { _id: new ObjectId(documentId) },
                { $set: { status: "active", updatedAt: new Date() } }
            );
        });

        return {
            documentId,
            chunksCreated: chunks.length,
            status: "active",
        };
    }
);
