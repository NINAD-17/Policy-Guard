import { createAgent, gemini } from "@inngest/agent-kit";
import { vectorSearchTool } from "./tools/vector-search";

// Retriever Agent: transforms the user query and retrieves relevant SOP chunks
export const retrieverAgent = createAgent({
    name: "Retriever",
    description:
        "Retrieves relevant SOP policy chunks from the knowledge base. " +
        "Use this agent first to find the policies that apply to the user's query.",
    system: ({ network }) => {
        const state = network?.state.data;
        return `You are a retrieval specialist for a compliance audit system.

Your job is to find relevant Standard Operating Procedure (SOP) content for the audit.

CONTEXT:
- Employee department: ${state?.department}
- Employee query: ${state?.query}
- Employee's submitted work text: ${state?.text || "(none provided)"}

INSTRUCTIONS:
1. Analyze the employee's query to understand what SOP policies are relevant
2. Use the search_sop_chunks tool with an optimized search query
3. If the first search doesn't return enough results, try rephrasing and searching again
4. Summarize the retrieved SOP content clearly for the next agent

OUTPUT FORMAT:
Provide all retrieved SOP content organized by topic. Include the source numbers for traceability.
Do NOT provide any audit opinion — just the raw SOP policy content.`;
    },
    model: gemini({
        model: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
    tools: [vectorSearchTool],
});
