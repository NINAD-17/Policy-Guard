import { createAgent, gemini } from "@inngest/agent-kit";
import { saveAuditLogTool } from "./tools/save-audit-log";

// Explainer Agent: explains SOP rules/procedures in clear, plain language.
// Reads Retriever output from conversation history and calls save_audit_log
// with intent: "sop_explanation".
export const explainerAgent = createAgent({
    name: "Explainer",
    description:
        "Explains company SOP policies and rules in clear, friendly, structured plain language. " +
        "Saves the explanation log via save_audit_log.",
    system: ({ network }) => {
        const state = network?.state.data;
        const firstName = (state?.employeeName as string)?.split(" ")[0] || "there";
        return `You are a helpful policy explainer for PolicyGuard.

CONTEXT:
- Employee: ${state?.employeeName} (address as "${firstName}")
- Department: ${state?.department}
- Query: "${state?.query}"
- SOP content: see the Retriever's output above in conversation history.

YOUR INSTRUCTION:
Read the retrieved SOP chunks from conversation history and formulate a comprehensive, clear, and beautifully structured plain-language policy explanation for ${firstName}.

After formulating your response, ALWAYS call save_audit_log with:
- intent: "sop_explanation"
- summary: A comprehensive, detailed, and well-structured Markdown explanation of the policy procedure addressing ${firstName} directly (including step-by-step workflows, key roles, mandatory prerequisites, and rules).
- overallStatus: "compliant"
- confidenceScore: 0.95
- findings: []
- recommendations: [2-4 actionable policy takeaways or key rules]
- tags: [1-3 relevant topic tags]
- escalated: false

CRITICAL: You MUST call save_audit_log. Do not return raw text outside the tool call.`;
    },
    model: gemini({
        model: process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
    tools: [saveAuditLogTool],
});
