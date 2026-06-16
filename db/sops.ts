import { clientPromise } from "@/lib/db";
import { COLLECTIONS, SOPDocument, SOPChunk } from "@/lib/types";
import { ObjectId } from "mongodb";

export async function getSOPDocument(id: string | ObjectId): Promise<SOPDocument | null> {
    const client = await clientPromise;
    const db = client.db();
    const docId = typeof id === "string" ? new ObjectId(id) : id;
    const doc = await db.collection(COLLECTIONS.SOP_DOCUMENTS).findOne({ _id: docId });
    return doc as unknown as SOPDocument | null;
}

export async function getSOPDocuments(filter: Record<string, unknown> = {}): Promise<SOPDocument[]> {
    const client = await clientPromise;
    const db = client.db();
    const docs = await db.collection(COLLECTIONS.SOP_DOCUMENTS)
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();
    return docs as unknown as SOPDocument[];
}

export async function createSOPDocument(doc: Omit<SOPDocument, "_id">): Promise<string> {
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection(COLLECTIONS.SOP_DOCUMENTS).insertOne(doc);
    return result.insertedId.toString();
}

export async function updateSOPDocument(id: string | ObjectId, updates: Partial<SOPDocument>): Promise<void> {
    const client = await clientPromise;
    const db = client.db();
    const docId = typeof id === "string" ? new ObjectId(id) : id;
    await db.collection(COLLECTIONS.SOP_DOCUMENTS).updateOne(
        { _id: docId },
        { $set: updates }
    );
}

export async function deleteSOPDocument(id: string | ObjectId): Promise<void> {
    const client = await clientPromise;
    const db = client.db();
    const docId = typeof id === "string" ? new ObjectId(id) : id;
    await db.collection(COLLECTIONS.SOP_DOCUMENTS).deleteOne({ _id: docId });
}

export async function insertSOPChunks(chunks: Omit<SOPChunk, "_id">[]): Promise<void> {
    if (!chunks.length) return;
    const client = await clientPromise;
    const db = client.db();
    await db.collection(COLLECTIONS.SOP_CHUNKS).insertMany(chunks);
}

export async function deleteSOPChunks(documentId: string | ObjectId): Promise<void> {
    const client = await clientPromise;
    const db = client.db();
    const docId = typeof documentId === "string" ? new ObjectId(documentId) : documentId;
    await db.collection(COLLECTIONS.SOP_CHUNKS).deleteMany({ documentId: docId });
}

export async function vectorSearchSOPChunks(queryEmbedding: number[], role: string, department: string | undefined, limit: number = 8) {
    const client = await clientPromise;
    const db = client.db();

    const searchStage: Record<string, unknown> = {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: limit,
    };

    if (role !== "admin" && department) {
        searchStage.filter = {
            $or: [
                { scope: "global" },
                { departments: department },
            ],
        };
    }

    console.debug("results getting...", searchStage);
    const results = await db.collection(COLLECTIONS.SOP_CHUNKS).aggregate([
        {
            $vectorSearch: searchStage,
        },
        {
            $lookup: {
                from: COLLECTIONS.SOP_DOCUMENTS,
                localField: "documentId",
                foreignField: "_id",
                as: "document",
            },
        },
        {
            $unwind: { path: "$document", preserveNullAndEmptyArrays: true },
        },
        {
            $project: {
                content: 1,
                score: { $meta: "vectorSearchScore" },
                documentId: 1,
                documentTitle: { $ifNull: ["$document.title", "Unknown Document"] },
                chunkIndex: 1,
                pageNumber: 1,
                _id: 0,
            },
        },
    ]).toArray();

    return results;
}
