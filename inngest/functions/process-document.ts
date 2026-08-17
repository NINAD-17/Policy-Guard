import { inngest } from "../client";
import { downloadFile } from "@/lib/storage";
import { generateEmbeddings } from "@/lib/embeddings";
import {
    deleteSOPChunks,
    getSOPChunksByDocumentId,
    insertSOPChunks,
    updateSOPChunkEmbeddings,
    updateSOPDocument,
} from "@/db/sops";
import type { SOPChunk } from "@/lib/types";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ObjectId } from "mongodb";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const BATCH_SIZE = 20;

/**
 * Inngest function: process-document
 *
 * Resilient, chunk-batched PDF ingestion pipeline:
 * 1. Single Step ("download-and-extract-chunks"): Downloads PDF from S3, parses & splits text,
 *    and stores initial chunk records directly into MongoDB (`embedding: []`). Returns only `{ totalChunks }`.
 * 2. Batched Step Loop ("process-batch-${batchIndex}"): Each step fetches a batch of 20 chunks from DB,
 *    generates Gemini embeddings, bulk updates MongoDB, and checkpoints state natively in Inngest.
 * 3. Final Step ("activate-document"): Updates document status to "active".
 */
export const processDocument = inngest.createFunction(
    {
        id: "process-document",
        retries: 10,
    },
    { event: "sop/document.uploaded" },
    async ({ event, step }) => {
        const { documentId, s3Key, scope, departments } = event.data;

        // Step 1: Download PDF from S3, parse & split into chunks, store initial records in DB
        const { totalChunks } = await step.run(
            "download-and-extract-chunks",
            async () => {
                const buffer = await downloadFile(s3Key);
                const tempPath = join(
                    tmpdir(),
                    `sop-${documentId}-${Date.now()}.pdf`
                );
                await writeFile(tempPath, buffer);

                try {
                    const loader = new PDFLoader(tempPath);
                    const docs = await loader.load();

                    // Guard: if PDF has no extractable text
                    if (
                        !docs ||
                        docs.length === 0 ||
                        !docs.some((d) => d.pageContent.trim().length > 0)
                    ) {
                        return { totalChunks: 0 };
                    }

                    const splitter = new RecursiveCharacterTextSplitter({
                        chunkSize: 1000,
                        chunkOverlap: 200,
                    });
                    const splitDocs = await splitter.splitDocuments(docs);

                    if (!splitDocs || splitDocs.length === 0) {
                        return { totalChunks: 0 };
                    }

                    // Delete existing chunks if retried
                    await deleteSOPChunks(documentId);

                    // Insert raw chunks into DB (embeddings initialized as empty vector)
                    const sopChunks: Omit<SOPChunk, "_id">[] = splitDocs.map(
                        (doc, index) => ({
                            documentId: new ObjectId(documentId),
                            content: doc.pageContent,
                            chunkIndex: index,
                            pageNumber:
                                doc.metadata?.loc?.pageNumber ||
                                doc.metadata?.page ||
                                1,
                            embedding: [],
                            scope,
                            departments,
                        })
                    );

                    await insertSOPChunks(sopChunks);

                    return { totalChunks: sopChunks.length };
                } finally {
                    await unlink(tempPath).catch(() => {});
                }
            }
        );

        // Guard: if PDF had no extractable text, mark as failed and stop
        if (!totalChunks || totalChunks === 0) {
            await step.run("mark-failed", async () => {
                await updateSOPDocument(documentId, {
                    status: "failed",
                    updatedAt: new Date(),
                });
            });
            return { documentId, error: "No extractable text found in PDF" };
        }

        // Step 2: Process embeddings in batch checkpoints (resumable upon retry / timeout)
        const totalBatches = Math.ceil(totalChunks / BATCH_SIZE);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIdx = batchIndex * BATCH_SIZE;

            await step.run(`process-batch-${batchIndex}`, async () => {
                const batchChunks = await getSOPChunksByDocumentId(
                    documentId,
                    startIdx,
                    BATCH_SIZE
                );

                if (!batchChunks || batchChunks.length === 0) {
                    return { batchIndex, processed: 0 };
                }

                // Generate embeddings for this batch of text strings
                const texts = batchChunks.map((c) => c.content);
                const embeddings = await generateEmbeddings(texts);

                // Bulk update MongoDB with generated embedding vectors
                const updates = batchChunks.map((chunk, idx) => ({
                    id: chunk._id!,
                    embedding: embeddings[idx],
                }));

                await updateSOPChunkEmbeddings(updates);

                return { batchIndex, processed: updates.length };
            });
        }

        // Step 3: Mark document as active
        await step.run("activate-document", async () => {
            await updateSOPDocument(documentId, {
                status: "active",
                updatedAt: new Date(),
            });
        });

        return {
            documentId,
            chunksCreated: totalChunks,
            batchesProcessed: totalBatches,
            status: "active",
        };
    }
);
