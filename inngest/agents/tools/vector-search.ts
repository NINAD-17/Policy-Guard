import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
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

        // MongoDB Atlas Vector Search with scope filtering
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
                    $project: {
                        content: 1,
                        score: { $meta: "vectorSearchScore" },
                        documentId: 1,
                        chunkIndex: 1,
                        _id: 0,
                    },
                },
            ])
            .toArray();

        if (results.length === 0) {
            return "No relevant SOP content found for this query.";
        }

        return results
            .map(
                (r, i) =>
                    `[Source ${i + 1}] (score: ${r.score.toFixed(3)})\n${r.content}`
            )
            .join("\n\n---\n\n");
    },
});
