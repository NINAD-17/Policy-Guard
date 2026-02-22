import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processDocument } from "@/inngest/functions/process-document";
import { complianceAudit } from "@/inngest/functions/compliance-audit";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [processDocument, complianceAudit],
});
