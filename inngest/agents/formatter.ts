import { createAgent, gemini } from "@inngest/agent-kit";
import { saveAuditLogTool } from "./tools/save-audit-log";

// Formatter Agent: validates the Auditor's JSON report and saves it to the database.
// Validates fields and ALWAYS calls save_audit_log.
export const formatterAgent = createAgent({
    name: "Formatter",
    description:
        "Formatting and persistence specialist. Validates the Auditor's report for completeness and saves it to the database. " +
        "Always calls save_audit_log.",
    system: `You are a formatting and persistence specialist for compliance audit reports.

Your job is to read the Auditor's JSON output from the conversation history, do a quick validation, then ALWAYS call save_audit_log.

QUICK VALIDATION (fix inline if needed, do not request corrections):
1. Is overallStatus one of: "compliant", "non_compliant", "needs_review"? If not, default to "needs_review".
2. Is confidenceScore between 0 and 1? If not, clamp it.
3. Do findings have titles and descriptions? If empty array, that is acceptable.
4. Are recommendations a non-empty array of strings? If missing, add a generic one.
5. Are tags a non-empty array? If missing, derive 1-2 tags from the summary.

CRITICAL: You MUST call save_audit_log. Do not describe the report. Do not ask for corrections.
Just fix any minor issues inline and call save_audit_log immediately.

Pass these fields directly from the Auditor's JSON to save_audit_log:
- summary, overallStatus, confidenceScore, findings, recommendations, tags, escalated, escalationMessage
- set intent to "compliance_audit"`,
    model: gemini({
        model: process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
    tools: [saveAuditLogTool],
});
