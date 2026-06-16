import { createNetwork } from "@inngest/agent-kit";
import { routerAgent } from "./router";
import { retrieverAgent } from "./retriever";
import { auditorAgent } from "./auditor";
import { graderAgent } from "./grader";

// Network with intent-based routing:
// 1. Router  → classifies intent (chitchat vs compliance_audit) using cheap model
// 2. If compliance_audit: Retriever → Auditor → Grader → done
// 3. If chitchat: stop immediately — compliance-audit.ts saves a lightweight log
export function createComplianceNetwork() {
    return createNetwork({
        name: "compliance-audit-network",
        agents: [routerAgent, retrieverAgent, auditorAgent, graderAgent],
        maxIter: 5, // Router(1) + Retriever(1) + Auditor(1) + Grader(1) + safety buffer(1)
        router: ({ network, lastResult, callCount }) => {

            // ── Call 0: Always start with the Router (cheap classifier) ──
            if (callCount === 0) {
                return routerAgent;
            }

            // ── Call 1: Read Router output and route accordingly ──
            if (callCount === 1) {
                // Parse the router's JSON output and save intent to state
                const routerTextMsg = lastResult?.output?.find(
                    (msg: { type: string }) => msg.type === "text"
                );
                if (routerTextMsg && "content" in routerTextMsg) {
                    try {
                        const parsed = JSON.parse(routerTextMsg.content as string);
                        // Save intent and response to state for compliance-audit.ts to read
                        if (network?.state.data) {
                            network.state.data.intent = parsed.intent;
                            network.state.data.routerResponse = parsed.response || null;
                        }
                        if (parsed.intent === "chitchat") {
                            return undefined; // Stop — compliance-audit.ts handles the save
                        }
                    } catch {
                        // If JSON parse fails, assume it needs a full audit to be safe
                        if (network?.state.data) {
                            network.state.data.intent = "compliance_audit";
                        }
                    }
                }
                // It's a compliance audit → run Retriever
                return retrieverAgent;
            }

            // ── Call 2: Retriever ran → now run Auditor ──
            if (callCount === 2) {
                return auditorAgent;
            }

            // ── Call 3: Auditor ran → now run Grader ──
            if (callCount === 3) {
                return graderAgent;
            }

            // ── Call 4: Grader ran → check if it saved the report ──
            // If Grader called save_audit_log (tool call present) → done
            // If Grader had no tool call → it returned text corrections, stop anyway
            // (Correction loop removed — Grader is trusted to validate and save directly)
            return undefined;
        },
    });
}
