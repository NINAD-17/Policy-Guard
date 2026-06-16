import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { generateEmbedding } from "@/lib/embeddings";
import { vectorSearchSOPChunks } from "@/db/sops";

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
        const state = network?.state.data;
        const department = state?.department as string;
        const role = (state?.role as string) || "employee";

        // Generate embedding for the search query
        const queryEmbedding = await generateEmbedding(searchQuery);

        // MongoDB Atlas Vector Search with scope filtering + $lookup for doc titles
        const results = await vectorSearchSOPChunks(queryEmbedding, role, department, 8);

        if (results.length === 0) {
            return "No relevant SOP content found for this query.";
        }

        // Store source metadata in network state for the Grader to use later
        const existingSources = (network?.state.data?.sourceDocuments as any[]) || [];
        const startIndex = existingSources.length;

        const newSourceDocuments = results.map((r, i) => ({
            index: startIndex + i + 1,
            documentTitle: r.documentTitle as string,
            documentId: (r.documentId as ObjectId).toString(),
            pageNumber: r.pageNumber as number | undefined,
        }));

        // Save to network state so Grader can access it
        if (network?.state.data) {
            network.state.data.sourceDocuments = [...existingSources, ...newSourceDocuments];
        }

        // Format output with document metadata for the Auditor
        return results
            .map(
                (r, i) =>
                    `[Source ${startIndex + i + 1} | Document: "${r.documentTitle}"${r.pageNumber ? ` (Page ${r.pageNumber})` : ""} | DocID: ${r.documentId}] (score: ${(r.score as number).toFixed(3)})\n${r.content}`
            )
            .join("\n\n---\n\n");
    },
});
