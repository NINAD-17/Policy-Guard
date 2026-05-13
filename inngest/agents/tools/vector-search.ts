import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { clientPromise } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { COLLECTIONS } from "@/lib/types";

// Searches SOP chunks using MongoDB Atlas Vector Search
// Scoped to global SOPs + the employee's department
export const vectorSearchTool = createTool({
    name: "search_sop_chunks",
    description:
        "Search the SOP knowledge base for relevant policy chunks. " +
        "Use this tool when you need to find SOP rules, guidelines, or procedures " +
        "relevant to the user's query. Pass a concise, optimized search query.",
    parameters: z.object({
        searchQuery: z
            .string()
            .describe("The optimized search query to find relevant SOP content"),
    }),
    handler: async ({ searchQuery }, { network }) => {
        const department = network?.state.data?.department as string;

        // Generate embedding for the search query
        const queryEmbedding = await generateEmbedding(searchQuery);

        const client = await clientPromise;
        const db = client.db();

        // MongoDB Atlas Vector Search with scope filtering + $lookup for doc titles
        const results = await db
            .collection(COLLECTIONS.SOP_CHUNKS)
            .aggregate([
                {
                    $vectorSearch: {
                        index: "vector_index",
                        path: "embedding",
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: 8,
                        filter: {
                            $or: [
                                { scope: "global" },
                                { departments: department },
                            ],
                        },
                    },
                },
                {
                    // Join with sop_documents to get the document title
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
                        _id: 0,
                    },
                },
            ])
            .toArray();

        console.log("DEBUG: Retrieved SOP Chunks[0]: ", results[0], "\n\n");

        if (results.length === 0) {
            return "No relevant SOP content found for this query.";
        }

        // Store source metadata in network state for the Grader to use later
        const sourceDocuments = results.map((r, i) => ({
            index: i + 1,
            documentTitle: r.documentTitle as string,
            documentId: (r.documentId as ObjectId).toString(),
        }));

        // Save to network state so Grader can access it
        if (network?.state.data) {
            network.state.data.sourceDocuments = sourceDocuments;
        }

        // Format output with document metadata for the Auditor
        return results
            .map(
                (r, i) =>
                    `[Source ${i + 1} | Document: "${r.documentTitle}" | DocID: ${r.documentId}] (score: ${(r.score as number).toFixed(3)})\n${r.content}`
            )
            .join("\n\n---\n\n");
    },
});
