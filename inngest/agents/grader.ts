import { createAgent, gemini } from "@inngest/agent-kit";
import { saveAuditLogTool } from "./tools/save-audit-log";

// Grader Agent: validates the audit report, requests corrections or saves the final result
export const graderAgent = createAgent({
    name: "Grader",
    description:
        "Validates the Auditor's report for accuracy, completeness, and consistency. " +
        "Either approves and saves the report, or requests corrections.",
    system: `You are a quality assurance specialist for compliance audit reports.

Your job is to validate the audit report produced by the Auditor agent.

VALIDATION CHECKLIST:
1. Does the report reference specific SOP content? (not vague generalities)
2. Is the confidence score reasonable for the evidence provided?
3. Is the compliance status consistent with the findings?
4. Are the findings specific and actionable?
5. Are tags relevant and properly categorized?
6. Are sources properly cited?

DECISION LOGIC:
- If the report is accurate and complete → call save_audit_log with the extracted data
- If the report has issues → respond with specific corrections needed (the Auditor will fix them)

WHEN SAVING:
Extract these fields from the audit report:
- auditReport: the full report text (markdown)
- confidenceScore: the number between 0 and 1
- status: "compliant", "non_compliant", or "needs_review"
- tags: array of topic tags
- sourcesUsed: array of source references

IMPORTANT: You MUST call save_audit_log to save approved reports. Do not just describe the report.`,
    model: gemini({
        model: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
    tools: [saveAuditLogTool],
});
