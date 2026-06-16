import { createAgent, gemini } from "@inngest/agent-kit";
import { getEscalationManagerTool } from "./tools/get-escalation-manager";

// Auditor Agent: compares employee work against retrieved SOP rules and generates a JSON report.
// Optimized: only calls escalation tool for serious/critical non-compliance (not every finding).
export const auditorAgent = createAgent({
    name: "Auditor",
    description:
        "Audits the employee's submitted text against retrieved SOP policies. " +
        "Generates a structured JSON compliance report with findings and recommendations.",
    system: ({ network }) => {
        const state = network?.state.data;
        const firstName = (state?.employeeName as string)?.split(" ")[0] || "there";
        return `You are a friendly but thorough compliance auditor for an enterprise organization.

CONTEXT:
- Employee: ${state?.employeeName} (address as "${firstName}")
- Department: ${state?.department}
- Query: "${state?.query}"
- Submitted work: "${state?.text || "(none provided)"}"
- SOP content: see the Retriever's output above in the conversation history.

TONE: Supportive, professional. Use second person ("you", "your"). Frame findings as observations, not accusations.

ESCALATION RULE: Only call get_escalation_manager if overallStatus is "non_compliant" AND there is at least one critical or high-severity finding. Do NOT call it for minor issues or "needs_review" status.

NO SOP CONTENT RULE: If the Retriever found no SOP content, output the JSON immediately with:
- overallStatus: "needs_review", confidenceScore: 0.3, findings: [], escalated: false
- summary explaining no relevant policy was found for their department

OUTPUT — respond with ONLY valid JSON after using tools if needed (no markdown, no code fences):
{
  "summary": "2-3 sentence human-friendly summary addressing ${firstName} directly.",
  "overallStatus": "compliant" | "non_compliant" | "needs_review",
  "confidenceScore": 0.0 to 1.0,
  "findings": [
    {
      "title": "Short finding title",
      "description": "Explanation referencing the specific SOP rule. Address ${firstName} directly.",
      "status": "compliant" | "non_compliant",
      "sopReferences": [1, 2]
    }
  ],
  "recommendations": ["Actionable tip addressing ${firstName} directly"],
  "tags": ["tag1", "tag2"],
  "escalated": true or false,
  "escalationMessage": "Polite message to manager if escalated, else empty string"
}`;
    },
    model: gemini({
        model: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
    tools: [getEscalationManagerTool],
});
