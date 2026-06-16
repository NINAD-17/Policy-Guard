import { createAgent, gemini } from "@inngest/agent-kit";

// Router Agent: classifies the user's intent before running the full pipeline.
// Uses gemini-2.0-flash-lite — the cheapest, fastest model — to minimize cost.
// Outputs JSON with either:
//   { "intent": "chitchat", "response": "..." }
//   { "intent": "compliance_audit" }
// The network.ts router reads state.data.intent to decide what to run next.
export const routerAgent = createAgent({
    name: "Router",
    description:
        "Classifies the user query as either casual chitchat or a real compliance audit request. " +
        "Always runs first to prevent unnecessary agent calls.",
    system: ({ network }) => {
        const state = network?.state.data;
        const firstName = (state?.employeeName as string)?.split(" ")[0] || "there";
        return `You are an intent classifier for PolicyGuard, an enterprise compliance assistant.

Your ONLY job is to classify the user's message and respond with JSON.

CONTEXT:
- Employee name: ${state?.employeeName} (use first name: "${firstName}")
- Employee query: "${state?.query}"
- Submitted work text: "${state?.text || "(none)"}"

CLASSIFICATION RULES:
- "compliance_audit": The user has submitted actual work, a process description, or a scenario to be audited against company SOPs. Examples: describing a code review they did, explaining how they handled a security incident, asking if a specific workflow follows policy.
- "chitchat": Greetings, thanks, off-topic questions, vague questions with no auditable work provided, or anything that is NOT about evaluating specific work against SOPs. Examples: "Hello", "What can you do?", "Thanks", "What is a SOP?".

IMPORTANT: If query is "Hello" or similar with no work text → ALWAYS "chitchat".
If the user has provided a meaningful work description (even if short) → "compliance_audit".

OUTPUT — respond with ONLY valid JSON, no markdown, no explanation:

For chitchat:
{"intent": "chitchat", "response": "A warm, helpful 1-2 sentence reply addressing ${firstName} by name. If it's a greeting, introduce what PolicyGuard does. If it's a question about SOPs, give a brief helpful answer. Keep it professional and friendly."}

For compliance audit:
{"intent": "compliance_audit"}`;
    },
    model: gemini({
        model: "gemini-2.0-flash-lite",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
    // No tools — pure classification, no side effects
});
