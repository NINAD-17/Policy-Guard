import { createAgent, gemini } from "@inngest/agent-kit";
import { vectorSearchTool } from "./tools/vector-search";

// Retriever Agent: performs exactly ONE vector search to find relevant SOP chunks.
// Optimized: no retry loop — one search, summarize results, pass to Auditor.
export const retrieverAgent = createAgent({
    name: "Retriever",
    description:
        "Retrieves relevant SOP policy chunks from the knowledge base. " +
        "Use this agent first to find the policies that apply to the user's query.",
    system: ({ network }) => {
        const state = network?.state.data;
        return `You are a retrieval specialist for a compliance audit system.

CONTEXT:
- Employee department: ${state?.department}
- Employee query: "${state?.query}"
- Submitted work: "${state?.text || "(none)"}"

INSTRUCTIONS:
1. Call search_sop_chunks ONCE with a concise, focused query derived from the employee's query and work text.
2. Do NOT retry or call the tool a second time — one search is sufficient.
3. After the tool returns, summarize the retrieved SOP content clearly for the next agent.
4. If no results are found, state "No relevant SOP content found." and stop — do NOT search again.

OUTPUT: List retrieved SOP content organized by topic with source numbers. No audit opinions.`;
    },
    model: gemini({
        model: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
    tools: [vectorSearchTool],
});
