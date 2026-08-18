import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getUserProfile } from "@/db/users";
import { clientPromise } from "@/lib/db";
import { COLLECTIONS } from "@/lib/types";
import { calculateEstimatedTokens } from "@/lib/token-calculator";

// GET /api/admin/stats — Admin Statistics & Token Usage Analytics
export async function GET() {
    try {
        const session = await requireSession();
        const profile = await getUserProfile(session.user.id);
        const isGuest = session.user.email === "guest@policypulse.dev";

        if (profile?.role !== "admin" && !isGuest) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db();

        const [auditLogs, sopDocs] = await Promise.all([
            db.collection(COLLECTIONS.AUDIT_LOGS).find({ status: { $ne: "processing" } }).toArray(),
            db.collection(COLLECTIONS.SOP_DOCUMENTS).find({}).toArray(),
        ]);

        // ── 1. Top KPIs ──
        const totalAudits = auditLogs.length;
        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;
        let totalTokens = 0;
        let totalEstimatedCostUSD = 0;
        let totalEscalations = 0;

        // ── 2. Distributions ──
        const complianceStatusCounts = {
            compliant: 0,
            non_compliant: 0,
            needs_review: 0,
        };

        const intentCounts = {
            compliance_audit: 0,
            sop_explanation: 0,
            sop_search: 0,
            chitchat: 0,
        };

        // ── 3. Department Breakdown ──
        const departmentMap = new Map<
            string,
            { department: string; count: number; totalTokens: number; costUSD: number; escalations: number }
        >();

        // ── 4. Document Citations ──
        const docCitationMap = new Map<string, { title: string; count: number }>();

        for (const log of auditLogs) {
            // Compliance status
            if (log.status in complianceStatusCounts) {
                complianceStatusCounts[log.status as keyof typeof complianceStatusCounts]++;
            }

            // Intent
            const intent = log.intent || "compliance_audit";
            if (intent in intentCounts) {
                intentCounts[intent as keyof typeof intentCounts]++;
            }

            // Escalations
            if (log.escalated) {
                totalEscalations++;
            }

            // Token Usage Calculation
            let usage = log.tokenUsage;
            if (!usage) {
                const sourcesCount = Array.isArray(log.sourcesUsed) ? log.sourcesUsed.length : 0;
                const summaryLen = typeof log.auditReport === "object" ? log.auditReport.summary?.length || 500 : 500;
                usage = calculateEstimatedTokens({
                    query: log.userQuery || "",
                    text: log.userText || "",
                    sourcesCount,
                    responseLength: summaryLen,
                    intent,
                });
            }

            totalPromptTokens += usage.promptTokens;
            totalCompletionTokens += usage.completionTokens;
            totalTokens += usage.totalTokens;
            totalEstimatedCostUSD += usage.estimatedCostUSD;

            // Department Stats
            const dept = log.department || "Engineering";
            const deptStats = departmentMap.get(dept) || {
                department: dept,
                count: 0,
                totalTokens: 0,
                costUSD: 0,
                escalations: 0,
            };
            deptStats.count++;
            deptStats.totalTokens += usage.totalTokens;
            deptStats.costUSD += usage.estimatedCostUSD;
            if (log.escalated) deptStats.escalations++;
            departmentMap.set(dept, deptStats);

            // Document Citations
            if (Array.isArray(log.sourcesUsed)) {
                const seenDocIds = new Set<string>();
                for (const src of log.sourcesUsed) {
                    const title = typeof src === "string" ? src : src.documentTitle;
                    const docId = typeof src === "string" ? src : src.documentId || title;
                    if (title && !seenDocIds.has(docId)) {
                        seenDocIds.add(docId);
                        const docStat = docCitationMap.get(title) || { title, count: 0 };
                        docStat.count++;
                        docCitationMap.set(title, docStat);
                    }
                }
            }
        }

        // Format Department Breakdown array sorted by token count
        const departmentBreakdown = Array.from(departmentMap.values()).sort((a, b) => b.totalTokens - a.totalTokens);

        // Format Top Document Citations sorted by citation count
        const topCites = Array.from(docCitationMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // SOP Documents Summary
        const totalSOPDocuments = sopDocs.length;
        const globalSOPCount = sopDocs.filter((d) => d.scope === "global").length;
        const deptSOPCount = sopDocs.filter((d) => d.scope === "department-specific").length;

        const escalationRate = totalAudits > 0 ? Number(((totalEscalations / totalAudits) * 100).toFixed(1)) : 0;

        return NextResponse.json({
            kpis: {
                totalAudits,
                totalTokens,
                totalPromptTokens,
                totalCompletionTokens,
                totalEstimatedCostUSD: Number(totalEstimatedCostUSD.toFixed(4)),
                totalEscalations,
                escalationRate,
            },
            complianceDistribution: complianceStatusCounts,
            intentDistribution: intentCounts,
            departmentBreakdown,
            topCites,
            documentsSummary: {
                totalSOPDocuments,
                globalSOPCount,
                deptSOPCount,
            },
        });
    } catch (error) {
        if (error instanceof Response) return error;
        console.error("Admin stats error:", error);
        return NextResponse.json({ error: "Failed to fetch admin statistics" }, { status: 500 });
    }
}
