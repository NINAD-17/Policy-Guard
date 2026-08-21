import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processDocument } from "@/inngest/functions/process-document";
import { complianceAudit } from "@/inngest/functions/compliance-audit";

// Allow Inngest steps to run for up to 300 seconds on Vercel
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [processDocument, complianceAudit],
});
