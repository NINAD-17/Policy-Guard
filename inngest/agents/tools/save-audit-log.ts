import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { clientPromise } from "@/lib/db";
import { COLLECTIONS } from "@/lib/types";
import type { AuditLog } from "@/lib/types";

// Saves the final audit report to the audit_logs collection
export const saveAuditLogTool = createTool({
    name: "save_audit_log",
    description:
        "Save the completed audit report to the database. " +
        "Call this ONLY after the audit report has been validated and finalized. " +
        "Provide the full audit report, confidence score, compliance status, and relevant tags.",
    parameters: z.object({
        auditReport: z
            .string()
            .describe("The complete audit report in markdown format"),
        confidenceScore: z
            .number()
            .min(0)
            .max(1)
            .describe("Confidence score between 0 and 1"),
        status: z
            .enum(["compliant", "non_compliant", "needs_review"])
            .describe("Overall compliance status"),
        tags: z
            .array(z.string())
            .describe("Topic tags for this audit (e.g. 'code-review', 'safety')"),
        sourcesUsed: z
            .array(z.string())
            .describe("List of SOP source references used in the audit"),
    }),
    handler: async (
        { auditReport, confidenceScore, status, tags, sourcesUsed },
        { network }
    ) => {
        const state = network?.state.data;

        const auditLogEntry: AuditLog = {
            employeeId: state?.employeeId as string,
            department: state?.department as string,
            userQuery: state?.query as string,
            userText: state?.text as string,
            auditReport,
            confidenceScore,
            sourcesUsed,
            status,
            tags,
            escalated: false,
            createdAt: new Date(),
        };

        const client = await clientPromise;
        const db = client.db();
        const result = await db
            .collection(COLLECTIONS.AUDIT_LOGS)
            .insertOne(auditLogEntry);

        return `Audit log saved successfully with ID: ${result.insertedId}`;
    },
});
