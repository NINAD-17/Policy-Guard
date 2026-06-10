import { inngest } from "@/inngest/client";
import { createComplianceNetwork } from "@/inngest/agents/network";
import { createState } from "@inngest/agent-kit";

// Inngest function triggered by POST /api/chat
// Runs the compliance audit agent network
export const complianceAudit = inngest.createFunction(
    {
        id: "compliance-audit",
        retries: 1,
    },
    { event: "audit/query.submitted" },
    async ({ event }) => {
        const { query, text, employeeId, employeeName, department, sessionId, isGuest } = event.data;

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
                    sessionId,
                    isGuest,
                }),
            }
        );

        // Return a summary of what happened
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
            iterations: results.length,
        };
    }
);
