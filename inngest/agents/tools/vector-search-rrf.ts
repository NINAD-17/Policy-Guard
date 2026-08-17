import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { generateEmbeddings } from "@/lib/embeddings";
import { vectorSearchSOPChunks } from "@/db/sops";

// RRF constant factor
const RRF_K = 60;

// Performs Multi-Query Vector Search with Reciprocal Rank Fusion (RRF)
// Used for complex, vague, or multi-faceted queries
export const vectorSearchRRFTool = createTool({
    name: "search_sop_chunks_rrf",
    description:
        "Search the SOP knowledge base using Reciprocal Rank Fusion (RRF) across multiple sub-queries. " +
        "Use this tool when the query is complex, vague, or covers multiple distinct topics/departments. " +
        "Pass an array of 2 to 5 distinct sub-queries that break down the user's intent.",
    parameters: z.object({
        subQueries: z
            .array(z.string())
            .min(2, "Provide at least 2 sub-queries")
            .max(5, "Maximum 5 sub-queries allowed")
            .describe("List of 2 to 5 decomposed sub-queries derived from the original request"),
    }),
    handler: async ({ subQueries }, { network }) => {
        const state = network?.state.data;
        const department = state?.department as string;
        const role = (state?.role as string) || "employee";

        // 1. Generate embeddings for all sub-queries in batch
        const embeddings = await generateEmbeddings(subQueries);

        // 2. Execute vector search for each embedding in parallel
        const searchPromises = embeddings.map((emb) =>
            vectorSearchSOPChunks(emb, role, department, 8)
        );
        const searchResultsList = await Promise.all(searchPromises);

        // 3. Apply Reciprocal Rank Fusion (RRF)
        // Map key: chunk content string, value: merged item + accumulated RRF score
        const rrfMap = new Map<
            string,
            {
                score: number;
                content: string;
                documentTitle: string;
                documentId: ObjectId;
                chunkIndex: number;
                pageNumber?: number;
            }
        >();

        for (const resultSet of searchResultsList) {
            resultSet.forEach((chunk: any, rankIndex: number) => {
                const rank = rankIndex + 1; // 1-based rank
                const rrfScoreDelta = 1 / (RRF_K + rank);
                const contentKey = chunk.content;

                if (rrfMap.has(contentKey)) {
                    const existing = rrfMap.get(contentKey)!;
                    existing.score += rrfScoreDelta;
                } else {
                    rrfMap.set(contentKey, {
                        score: rrfScoreDelta,
                        content: chunk.content,
                        documentTitle: chunk.documentTitle as string,
                        documentId: chunk.documentId as ObjectId,
                        chunkIndex: chunk.chunkIndex as number,
                        pageNumber: chunk.pageNumber as number | undefined,
                    });
                }
            });
        }

        // 4. Sort by RRF score descending and take top 10
        const rankedResults = Array.from(rrfMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        if (rankedResults.length === 0) {
            return "No relevant SOP content found across any of the sub-queries.";
        }

        // 5. Store source chunk metadata in network state for Formatter to use
        const existingSources = (network?.state.data?.sourceChunks as any[]) || [];
        const startIndex = existingSources.length;

        const newSourceChunks = rankedResults.map((r, i) => ({
            index: startIndex + i + 1,
            documentTitle: r.documentTitle,
            documentId: (r.documentId as ObjectId).toString(),
            pageNumber: r.pageNumber,
        }));

        if (network?.state.data) {
            network.state.data.sourceChunks = [...existingSources, ...newSourceChunks];
        }

        // 6. Format output with document metadata
        return rankedResults
            .map(
                (r, i) =>
                    `[Source ${startIndex + i + 1} | Document: "${r.documentTitle}"${r.pageNumber ? ` (Page ${r.pageNumber})` : ""} | DocID: ${r.documentId}] (RRF Score: ${r.score.toFixed(4)})\n${r.content}`
            )
            .join("\n\n---\n\n");
    },
});
