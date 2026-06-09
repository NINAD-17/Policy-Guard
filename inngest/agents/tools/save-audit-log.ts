import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { clientPromise } from "@/lib/db";
import { createAuditLog } from "@/db/audits";
import { getUserProfile } from "@/db/users";
import { COLLECTIONS } from "@/lib/types";
import type { AuditLog, AuditReportStructured, AuditSource } from "@/lib/types";

// Saves the final audit report to the audit_logs collection
export const saveAuditLogTool = createTool({
    name: "save_audit_log",
    description:
        "Save the completed audit report to the database. " +
        "Call this ONLY after the audit report has been validated and finalized. " +
        "Pass the Auditor's JSON output fields directly.",
    parameters: z.object({
        summary: z
            .string()
            .describe("The human-friendly summary from the Auditor's JSON"),
        overallStatus: z
            .enum(["compliant", "non_compliant", "needs_review"])
            .describe("Overall compliance status"),
        confidenceScore: z
            .number()
            .min(0)
            .max(1)
            .describe("Confidence score between 0 and 1"),
        findings: z
            .array(
                z.object({
                    title: z.string(),
                    description: z.string(),
                    status: z.enum(["compliant", "non_compliant"]),
                    sopReferences: z.array(z.number()),
                })
            )
            .describe("Array of finding objects from the Auditor's JSON"),
        recommendations: z
            .array(z.string())
            .describe("Array of recommendation strings"),
        tags: z
            .array(z.string())
            .describe("Topic tags for this audit (e.g. 'code-review', 'safety')"),
        escalated: z.boolean().optional(),
        escalationMessage: z.string().optional(),
    }),
    handler: async (
        { summary, overallStatus, confidenceScore, findings, recommendations, tags, escalated, escalationMessage },
        { network }
    ) => {
        const state = network?.state.data;

        // Build the structured audit report
        const auditReport: AuditReportStructured = {
            summary,
            findings,
            recommendations,
        };

        // Get source documents from network state (set by the Retriever)
        const sourcesUsed: AuditSource[] =
            (state?.sourceDocuments as AuditSource[]) || [];

        // Look up manager info if escalated
        let escalatedToId: string | undefined = undefined;
        let escalatedToName: string | undefined = undefined;

        if (escalated) {
            const userProfile = await getUserProfile(state?.employeeId as string);
            if (userProfile && userProfile.escalationManagerId) {
                escalatedToId = userProfile.escalationManagerId;
                
                // Fetch manager's Better Auth user to get their name
                const client = await clientPromise;
                const db = client.db();
                const managerUser = await db.collection("user").findOne({ id: escalatedToId });
                if (managerUser) {
                    escalatedToName = managerUser.name as string;
                }
            }
        }

        const auditLogEntry: AuditLog = {
            employeeId: state?.employeeId as string,
            employeeName: state?.employeeName as string,
            department: state?.department as string,
            userQuery: state?.query as string,
            userText: state?.text as string,
            auditReport,
            confidenceScore,
            sourcesUsed,
            status: overallStatus,
            tags,
            escalated: escalated || false,
            escalatedToId,
            escalatedToName,
            escalationMessage,
            createdAt: new Date(),
        };

        const insertedId = await createAuditLog(auditLogEntry);

        return `Audit log saved successfully with ID: ${insertedId}`;
    },
});
