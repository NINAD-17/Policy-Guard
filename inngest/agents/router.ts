import { createAgent, gemini } from "@inngest/agent-kit";

// Router Agent: classifies the user's intent before running the compliance network.
// Uses gemini-2.5-flash-lite — the fast, cost-effective classifier.
// Outputs JSON with one of 4 intents:
//   { "intent": "chitchat", "response": "..." }
//   { "intent": "compliance_audit", "response": null }
//   { "intent": "sop_search", "response": null }
//   { "intent": "sop_explanation", "response": null }
export const routerAgent = createAgent({
    name: "Router",
    description:
        "Classifies user query into 4 distinct intents: compliance_audit, sop_search, sop_explanation, or chitchat.",
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
- "compliance_audit": The user has submitted actual work, code, a process description, or a work scenario to be audited against company SOPs. Examples: describing a code review they did, explaining how they handled a security incident, pasting work text to check compliance.
- "sop_search": The user specifically wants to find, locate, or list relevant SOP documents in the repository. Examples: "Find SOPs about data retention", "Search security documents", "Where is the remote work policy?".
- "sop_explanation": The user wants an SOP policy, rule, or procedure explained in plain language, without submitting work to be audited. Examples: "What does our leave policy say about sick leaves?", "Explain the password policy", "How does expense reimbursement work?".
- "chitchat": Greetings, thanks, off-topic questions, vague questions with no specific context, or meta questions about PolicyGuard. Examples: "Hello", "Thanks!", "What can you do?", "Is this okay?" (without context).

CRITICAL HEURISTIC:
If the user submitted non-empty work text (more than a few words of work/code) → ALWAYS "compliance_audit".

OUTPUT — respond with ONLY valid JSON, no markdown, no explanation:

For chitchat:
{"intent": "chitchat", "response": "A warm, helpful 1-2 sentence reply addressing ${firstName} by name. Introduce PolicyGuard or answer briefly."}

For compliance audit:
{"intent": "compliance_audit", "response": null}

For SOP search:
{"intent": "sop_search", "response": null}

For SOP explanation:
{"intent": "sop_explanation", "response": null}`;
    },
    model: gemini({
        model: process.env.GEMINI_LITE_MODEL || "gemini-2.5-flash-lite",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
    // No tools — pure classification, no side effects
});
