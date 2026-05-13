import { createNetwork } from "@inngest/agent-kit";
import { retrieverAgent } from "./retriever";
import { auditorAgent } from "./auditor";
import { graderAgent } from "./grader";

// Network with deterministic routing:
// 1. Retriever → search SOPs
// 2. Auditor → compare text vs SOPs
// 3. Grader → validate + save (may loop back to Auditor once for corrections)
export function createComplianceNetwork() {
    return createNetwork({
        name: "compliance-audit-network",
        agents: [retrieverAgent, auditorAgent, graderAgent],
        maxIter: 6, // Retriever(1) + Auditor(1) + Grader(1) + correction loop(2) + final save(1)
        router: ({ lastResult, callCount }) => {
            // Call 0: start with Retriever to fetch SOPs
            if (callCount === 0) {
                return retrieverAgent;
            }
            console.log("DEBUG: Retriever Output: ", lastResult?.output, "\n\nVector Search Tool: ", lastResult?.toolCalls, "\n\n")

            // Call 1: Auditor compares text vs SOPs
            if (callCount === 1) {
                return auditorAgent;
            }

            // Call 2: Grader validates the report
            if (callCount === 2) {
                return graderAgent;
            }

            // Check if the Grader called save_audit_log (tool call present = done)
            const lastOutput = lastResult?.output ?? [];
            const hasToolCall = lastOutput.some(
                (msg) => msg.type === "tool_call"
            );

            if (hasToolCall) {
                // Grader saved the report, we're done
                return undefined;
            }

            // The Grader requested corrections → send back to Auditor
            if (callCount === 3) {
                return auditorAgent;
            }

            // Then back to Grader for final validation
            if (callCount === 4) {
                return graderAgent;
            }

            // Safety: stop after max iterations
            return undefined;
        },
    });
}
