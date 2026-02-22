import { createAgent, gemini } from "@inngest/agent-kit";

// Auditor Agent: compares employee's work text against SOP rules and generates report
export const auditorAgent = createAgent({
    name: "Auditor",
    description:
        "Audits the employee's submitted text against retrieved SOP policies. " +
        "Generates a detailed compliance report with confidence score and tags.",
    system: ({ network }) => {
        const state = network?.state.data;
        return `You are a compliance auditor for an enterprise organization.

Your job is to compare an employee's submitted work text against the relevant SOP (Standard Operating Procedure) rules and generate a detailed audit report.

CONTEXT:
- Employee department: ${state?.department}
- Employee query: "${state?.query}"
- Employee's submitted work text: "${state?.text || "(none provided)"}"

INSTRUCTIONS:
1. Review the SOP content provided by the Retriever agent (in the conversation history)
2. Compare the employee's work text against each relevant SOP rule
3. Identify compliance gaps, violations, and areas of alignment
4. Assign a confidence score (0.0 to 1.0) based on how certain you are of the assessment
5. Generate topic tags that categorize this audit

OUTPUT FORMAT (use this EXACT structure):

## Compliance Audit Report

### Summary
[One paragraph summary of findings]

### Compliance Status: [COMPLIANT | NON_COMPLIANT | NEEDS_REVIEW]

### Confidence Score: [0.0 - 1.0]

### Findings
1. **[Finding title]**: [Detail] — Status: ✅ Compliant / ❌ Non-compliant / ⚠️ Needs Review

### Recommendations
- [Actionable recommendation]

### Tags
[comma-separated topic tags, e.g. code-review, testing, documentation]

### Sources Used
[List the source numbers referenced from the SOP content]

GUARDRAILS:
- Only flag objective compliance issues based on SOP content
- Never provide legal advice
- If insufficient SOP content is available, set confidence below 0.6 and status to NEEDS_REVIEW`;
    },
    model: gemini({
        model: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
});
