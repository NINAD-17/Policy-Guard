import { inngest } from "@/inngest/client";
import { createComplianceNetwork } from "@/inngest/agents/network";
import { createState } from "@inngest/agent-kit";
import { createAuditLog } from "@/db/audits";

// Inngest function triggered by POST /api/chat
// Runs the compliance audit agent network
export const complianceAudit = inngest.createFunction(
    {
        id: "compliance-audit",
        retries: 1,
    },
    { event: "audit/query.submitted" },
    async ({ event }) => {
        const { query, text, employeeId, employeeName, department, role, sessionId, isGuest } = event.data;

        // DO NOT wrap network.run() in step.run() — AgentKit uses
        // Inngest steps internally. Nesting steps is not supported.
        const network = createComplianceNetwork();

        const networkRun = await network.run(
            `Employee query: "${query}"\n\nEmployee's submitted work text:\n${text || "(No text provided — answer based on the query alone)"}`,
            {
                state: createState({
                    query,
                    text,
                    employeeId,
                    employeeName,
                    department,
                    role,
                    sessionId,
                    isGuest,
                }),
            }
        );

        const finalState = networkRun.state.data;
        const intent = finalState?.intent as string | undefined;

        // If the Router classified this as chitchat, save a lightweight log entry
        // so the user sees the friendly response in their AuditFeed.
        if (intent === "chitchat") {
            const routerResponse = (finalState?.routerResponse as string) ||
                "Hi! I'm your compliance assistant. Submit a description of your work and I'll check it against company SOPs.";

            await createAuditLog({
                employeeId,
                employeeName,
                department,
                userQuery: query,
                userText: text || "",
                auditReport: {
                    summary: routerResponse,
                    findings: [],
                    recommendations: [],
                },
                confidenceScore: 1.0,
                sourcesUsed: [],
                status: "compliant",
                tags: ["chitchat"],
                escalated: false,
                sessionId,
                isGuest,
                createdAt: new Date(),
            });

            return { agentOutput: routerResponse, intent: "chitchat", iterations: 1 };
        }

        // For compliance_audit intent, the Grader's save_audit_log tool handled the save.
        const results = networkRun.state.results;
        const lastAgentResult = results[results.length - 1];
        const lastMessage = lastAgentResult?.output?.find(
            (msg: { type: string }) => msg.type === "text"
        );

        return {
            agentOutput:
                lastMessage && "content" in lastMessage
                    ? lastMessage.content
                    : "Audit completed",
            intent: "compliance_audit",
            iterations: results.length,
        };
    }
);
