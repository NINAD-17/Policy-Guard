import { createNetwork } from "@inngest/agent-kit";
import { routerAgent } from "./router";
import { retrieverAgent } from "./retriever";
import { auditorAgent } from "./auditor";
import { formatterAgent } from "./formatter";
import { explainerAgent } from "./explainer";

import { updateAuditLog } from "@/db/audits";

// Dynamic State-Driven Compliance Network:
// 1. Router Agent classifies intent into: chitchat, compliance_audit, sop_search, sop_explanation.
// 2. chitchat → stop immediately (compliance-audit.ts saves friendly log).
// 3. compliance_audit → Retriever → Auditor → (if low confidence: Retriever → Auditor) → Formatter → done.
// 4. sop_explanation → Retriever → Explainer → done.
// 5. sop_search → Retriever → stop (compliance-audit.ts saves document search log).
export function createComplianceNetwork() {
    return createNetwork({
        name: "compliance-audit-network",
        agents: [routerAgent, retrieverAgent, auditorAgent, formatterAgent, explainerAgent],
        maxIter: 10, // Safety buffer for multi-agent loops including re-retrieval
        router: async ({ network, lastResult, callCount }) => {
            const state = network?.state.data;
            const auditLogId = state?.auditLogId as string | undefined;

            const updateStatus = async (stepMessage: string) => {
                if (auditLogId) {
                    try {
                        await updateAuditLog(auditLogId, { currentStep: stepMessage });
                    } catch (err) {
                        console.error("Failed to update agent status in DB:", err);
                    }
                }
            };

            // ── Call 0: Always start with the Router (classifier) ──
            if (callCount === 0) {
                await updateStatus("🤖 Router Agent: Classifying query intent...");
                return routerAgent;
            }

            // ── Call 1: Read Router output & save intent to state ──
            if (callCount === 1) {
                const routerTextMsg = lastResult?.output?.find(
                    (msg: { type: string }) => msg.type === "text"
                );
                if (routerTextMsg && "content" in routerTextMsg) {
                    try {
                        const parsed = JSON.parse(routerTextMsg.content as string);
                        if (state) {
                            state.intent = parsed.intent;
                            state.routerResponse = parsed.response || null;
                        }
                        if (parsed.intent === "chitchat") {
                            return undefined; // Stop — compliance-audit.ts saves chitchat log
                        }
                    } catch {
                        if (state) {
                            state.intent = "compliance_audit";
                        }
                    }
                }
                // All other intents (compliance_audit, sop_search, sop_explanation) require Retriever
                await updateStatus("🔍 Retriever Agent: Searching SOP knowledge base...");
                return retrieverAgent;
            }

            // ── Call > 1: State-driven routing based on previous agent ──
            const lastAgentName = lastResult?.agentName;

            if (lastAgentName === "Retriever") {
                const intent = state?.intent;
                if (intent === "compliance_audit") {
                    await updateStatus("📋 Auditor Agent: Evaluating compliance rules against SOPs...");
                    return auditorAgent;
                }
                if (intent === "sop_explanation") {
                    await updateStatus("💡 Explainer Agent: Formulating policy explanation...");
                    return explainerAgent;
                }
                if (intent === "sop_search") {
                    // Stop — compliance-audit.ts handles saving the search result log
                    return undefined;
                }
                // Default fallback
                await updateStatus("📋 Auditor Agent: Evaluating compliance rules against SOPs...");
                return auditorAgent;
            }

            if (lastAgentName === "Auditor") {
                // Check if Auditor requested re-retrieval due to low confidence (< 0.5)
                const auditorText = lastResult?.output?.find(
                    (msg: { type: string }) => msg.type === "text"
                );
                if (auditorText && "content" in auditorText) {
                    try {
                        const parsed = JSON.parse(auditorText.content as string);
                        const retryCount = (state?.retrieverRetryCount as number) || 0;
                        if (parsed.needsMoreContext && parsed.refinedQuery && retryCount < 1) {
                            if (state) {
                                state.auditorRefinedQuery = parsed.refinedQuery;
                                state.retrieverRetryCount = retryCount + 1;
                            }
                            // Re-retrieve with RRF forced via auditor's refined query
                            await updateStatus("🔍 Retriever Agent: Performing secondary search for missing SOP context...");
                            return retrieverAgent;
                        }
                    } catch {
                        // If JSON parse fails, fall through to Formatter
                    }
                }
                await updateStatus("📝 Formatter Agent: Finalizing compliance report...");
                return formatterAgent;
            }

            if (lastAgentName === "Formatter" || lastAgentName === "Explainer") {
                // Done — log was saved via save_audit_log tool
                return undefined;
            }

            return undefined;
        },
    });
}
