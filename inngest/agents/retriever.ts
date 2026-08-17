import { createAgent, gemini } from "@inngest/agent-kit";
import { vectorSearchTool } from "./tools/vector-search";
import { vectorSearchRRFTool } from "./tools/vector-search-rrf";

// Retriever Agent: performs vector search (Simple or RRF) to find relevant SOP chunks.
export const retrieverAgent = createAgent({
    name: "Retriever",
    description:
        "Retrieves relevant SOP policy chunks using single vector search or Reciprocal Rank Fusion (RRF). " +
        "Selects the optimal retrieval tool based on query complexity.",
    system: ({ network }) => {
        const state = network?.state.data;
        const intent = state?.intent || "compliance_audit";
        const auditorRefinedQuery = state?.auditorRefinedQuery as string | undefined;

        return `You are an expert retrieval specialist for PolicyGuard enterprise SOP system.

CONTEXT:
- Intent: ${intent}
- Employee department: ${state?.department}
- Employee query: "${state?.query}"
- Submitted work: "${state?.text || "(none)"}"
${auditorRefinedQuery ? `- AUDITOR RE-RETRIEVAL REQUEST: "${auditorRefinedQuery}"` : ""}

TOOL SELECTION RULES (Call exactly ONE tool per run):
1. **${auditorRefinedQuery ? "MANDATORY" : "search_sop_chunks_rrf"}** (Reciprocal Rank Fusion):
   - Use if an Auditor requested re-retrieval (AUDITOR RE-RETRIEVAL REQUEST is present).
   - Use if the user query or submitted work is complex, vague, or spans multiple topics/departments.
   - Decompose the request into 2 to 5 distinct sub-query strings and pass them as an array to search_sop_chunks_rrf.

2. **search_sop_chunks** (Single Vector Search):
   - Use ONLY for clear, specific, single-topic queries (e.g. "What is the password expiry rule?").

INSTRUCTIONS:
1. Choose the single best tool (search_sop_chunks or search_sop_chunks_rrf) and call it ONCE.
2. After the tool returns, summarize the retrieved SOP content clearly, organizing by topic with source numbers.
3. If no results are found, state "No relevant SOP content found." and stop.

OUTPUT: Clear, structured summary of retrieved SOP policy content with source references. Do NOT provide audit opinions.`;
    },
    model: gemini({
        model: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
    tools: [vectorSearchTool, vectorSearchRRFTool],
});
