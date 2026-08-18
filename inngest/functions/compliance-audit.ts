import { inngest } from "@/inngest/client";
import { createComplianceNetwork } from "@/inngest/agents/network";
import { createState } from "@inngest/agent-kit";
import { createAuditLog, updateAuditLog } from "@/db/audits";

// Inngest function triggered by POST /api/chat
// Runs the compliance audit agent network
export const complianceAudit = inngest.createFunction(
    {
        id: "compliance-audit",
        retries: 1,
    },
    { event: "audit/query.submitted" },
    async ({ event, step }) => {
        const { query, text, employeeId, employeeName, department, role, sessionId, isGuest } = event.data;

        // Memoize initial AuditLog creation so Inngest step replays do NOT create duplicate DB entries
        const auditLogId = await step.run("init-audit-log", async () => {
            return await createAuditLog({
                employeeId,
                employeeName,
                department,
                userQuery: query,
                userText: text || "",
                intent: "compliance_audit",
                auditReport: {
                    summary: "AI agent network initiated...",
                    findings: [],
                    recommendations: [],
                },
                confidenceScore: 0,
                sourcesUsed: [],
                status: "processing",
                currentStep: "🤖 Router Agent: Classifying query intent...",
                tags: ["processing"],
                escalated: false,
                sessionId,
                isGuest,
                createdAt: new Date(),
            });
        });

        // DO NOT wrap network.run() in step.run() — AgentKit uses
        // Inngest steps internally. Nesting steps is not supported.
        const network = createComplianceNetwork();

        try {
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
                        auditLogId,
                    }),
                }
            );

            const finalState = networkRun.state.data;
            const intent = finalState?.intent as string | undefined;

            // If the Router classified this as chitchat, save a lightweight log entry
            if (intent === "chitchat") {
                const routerResponse = (finalState?.routerResponse as string) ||
                    "Hi! I'm your compliance assistant. Submit a description of your work and I'll check it against company SOPs.";

                await updateAuditLog(auditLogId, {
                    $set: {
                        intent: "chitchat",
                        auditReport: {
                            summary: routerResponse,
                            findings: [],
                            recommendations: [],
                        },
                        confidenceScore: 1.0,
                        sourcesUsed: [],
                        status: "compliant",
                        tags: ["chitchat"],
                    },
                    $unset: { currentStep: "" },
                });

                return { agentOutput: routerResponse, intent: "chitchat", iterations: 1 };
            }

            // If intent is sop_search, save document search results log
            if (intent === "sop_search") {
                const rawSources = (finalState?.sourceChunks as any[]) || [];
                
                // Deduplicate top 5 unique documents
                const uniqueDocsMap = new Map<string, { documentId: string; documentTitle: string; pageNumber?: number }>();
                for (const src of rawSources) {
                    if (src.documentId && !uniqueDocsMap.has(src.documentId)) {
                        uniqueDocsMap.set(src.documentId, {
                            documentId: src.documentId,
                            documentTitle: src.documentTitle,
                            pageNumber: src.pageNumber,
                        });
                    }
                    if (uniqueDocsMap.size >= 5) break;
                }
                const relatedDocuments = Array.from(uniqueDocsMap.values());

                const searchSummary = relatedDocuments.length > 0
                    ? `Found ${relatedDocuments.length} relevant SOP document(s) matching your query.`
                    : "No matching SOP documents found for your search query.";

                await updateAuditLog(auditLogId, {
                    $set: {
                        intent: "sop_search",
                        auditReport: {
                            summary: searchSummary,
                            findings: [],
                            recommendations: [],
                            relatedDocuments,
                        },
                        confidenceScore: 0.9,
                        sourcesUsed: rawSources,
                        status: "compliant",
                        tags: ["sop-search"],
                    },
                    $unset: { currentStep: "" },
                });

                return { agentOutput: searchSummary, intent: "sop_search", iterations: networkRun.state.results.length };
            }

            // For compliance_audit and sop_explanation intents, save_audit_log tool handled the update.
            const results = networkRun.state.results;
            const lastAgentResult = results[results.length - 1];
            const lastMessage = lastAgentResult?.output?.find(
                (msg: { type: string }) => msg.type === "text"
            );

            return {
                agentOutput:
                    lastMessage && "content" in lastMessage
                        ? lastMessage.content
                        : "Task completed",
                intent: intent || "compliance_audit",
                iterations: results.length,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Agent network execution failed.";
            console.error("Compliance Audit Execution Error:", error);

            // Update processing log entry with failure status so polling loop resolves cleanly
            await updateAuditLog(auditLogId, {
                $set: {
                    intent: "compliance_audit",
                    auditReport: {
                        summary: `An error occurred while processing your request: ${errorMessage}. Please try again or rephrase your query.`,
                        findings: [],
                        recommendations: [
                            "Try submitting your query again.",
                            "If using custom models, verify provider settings in environment configuration.",
                        ],
                    },
                    confidenceScore: 0,
                    sourcesUsed: [],
                    status: "needs_review",
                    tags: ["execution-error"],
                },
                $unset: { currentStep: "" },
            });

            return { error: errorMessage, status: "failed" };
        }
    }
);
