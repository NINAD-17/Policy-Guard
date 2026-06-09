import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { clientPromise } from "@/lib/db";
import { getUserProfile } from "@/db/users";

export const getEscalationManagerTool = createTool({
    name: "get_escalation_manager",
    description:
        "Looks up the correct manager or contact person to escalate compliance issues to. " +
        "Call this tool if you determine that the employee's work is non-compliant or needs review, " +
        "so you can instruct the employee on exactly who to contact for help.",
    parameters: z.object({}),
    handler: async (_, { network }) => {
        const state = network?.state.data;
        if (!state?.employeeId) {
            return "Unable to determine escalation manager: missing employee ID in state.";
        }

        const userProfile = await getUserProfile(state.employeeId as string);
        if (!userProfile || !userProfile.escalationManagerId) {
            return "No specific escalation manager is assigned. Please advise the employee to contact their department head.";
        }

        // Fetch manager's Better Auth user to get their name
        const client = await clientPromise;
        const db = client.db();
        const managerUser = await db.collection("user").findOne({ id: userProfile.escalationManagerId });

        if (!managerUser) {
            return "Escalation manager found in profile, but account details are missing. Advise employee to contact HR.";
        }

        return `The designated escalation manager is ${managerUser.name} (${managerUser.email}). Please tell the employee to contact them for assistance.`;
    },
});
