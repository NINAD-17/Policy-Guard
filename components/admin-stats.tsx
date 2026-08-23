"use client";

import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck,
    Zap,
    DollarSign,
    AlertTriangle,
    FileText,
    TrendingUp,
    Users,
    PieChart,
} from "lucide-react";

interface StatsData {
    kpis: {
        totalAudits: number;
        totalTokens: number;
        totalPromptTokens: number;
        totalCompletionTokens: number;
        totalEstimatedCostUSD: number;
        totalEscalations: number;
        escalationRate: number;
    };
    complianceDistribution: {
        compliant: number;
        non_compliant: number;
        needs_review: number;
    };
    intentDistribution: {
        compliance_audit: number;
        sop_explanation: number;
        sop_search: number;
        chitchat: number;
    };
    departmentBreakdown: {
        department: string;
        count: number;
        totalTokens: number;
        costUSD: number;
        escalations: number;
    }[];
    topCites: {
        title: string;
        count: number;
    }[];
    documentsSummary: {
        totalSOPDocuments: number;
        globalSOPCount: number;
        deptSOPCount: number;
    };
}

const fetcher = (url: string) =>
    fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    });

export function AdminStats() {
    const {
        data,
        isLoading: loading,
        error,
    } = useSWR<StatsData>("/api/admin/stats", fetcher, {
        revalidateOnFocus: true,
        keepPreviousData: true,
        dedupingInterval: 10000,
    });

    if (loading && !data) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center glass-panel rounded-2xl border-white/10">
                <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Failed to load statistics.</p>
            </div>
        );
    }

    const { kpis, complianceDistribution, intentDistribution, departmentBreakdown, topCites, documentsSummary } = data;

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Live Telemetry Status Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs shadow-sm">
                <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-medium text-foreground">
                        <strong className="text-emerald-400 font-semibold">Live Telemetry:</strong> Real-time metrics aggregated directly from active MongoDB Atlas audit logs and LLM token telemetry.
                    </span>
                </div>
                <span className="text-[11px] text-emerald-400/80 font-mono shrink-0 hidden md:inline-block">
                    MongoDB Atlas &bull; Live Aggregation
                </span>
            </div>

            {/* ── 1. Top KPI Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Audits */}
                <div className="glass-panel p-5 rounded-2xl border-white/10 flex items-center gap-4 relative overflow-hidden group">
                    <div className="p-3.5 bg-primary/10 rounded-2xl text-primary shrink-0 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Audits</p>
                        <h3 className="text-2xl font-bold text-foreground mt-0.5">{kpis.totalAudits}</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">Queries processed</p>
                    </div>
                </div>

                {/* Total Tokens */}
                <div className="glass-panel p-5 rounded-2xl border-white/10 flex items-center gap-4 relative overflow-hidden group">
                    <div className="p-3.5 bg-amber-500/10 rounded-2xl text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Tokens</p>
                        <h3 className="text-2xl font-bold text-foreground mt-0.5">{kpis.totalTokens.toLocaleString()}</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">Prompt + Completion</p>
                    </div>
                </div>

                {/* Estimated Cost */}
                <div className="glass-panel p-5 rounded-2xl border-white/10 flex items-center gap-4 relative overflow-hidden group">
                    <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated API Cost</p>
                        <h3 className="text-2xl font-bold text-foreground mt-0.5">${kpis.totalEstimatedCostUSD.toFixed(4)}</h3>
                        <p className="text-[11px] text-emerald-400 font-medium mt-1">Gemini 2.5 Flash rates</p>
                    </div>
                </div>

                {/* Escalation Rate */}
                <div className="glass-panel p-5 rounded-2xl border-white/10 flex items-center gap-4 relative overflow-hidden group">
                    <div className="p-3.5 bg-red-500/10 rounded-2xl text-red-400 shrink-0 group-hover:scale-110 transition-transform">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Escalation Rate</p>
                        <h3 className="text-2xl font-bold text-foreground mt-0.5">{kpis.escalationRate}%</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">{kpis.totalEscalations} escalated to manager</p>
                    </div>
                </div>
            </div>

            {/* ── 2. Distributions (Compliance & Intent) ───────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compliance Status Breakdown */}
                <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <PieChart className="h-5 w-5 text-primary" />
                            <h3 className="text-base font-semibold text-foreground">Compliance Status Distribution</h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Compliant */}
                        <div>
                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                <span className="text-emerald-400 flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Compliant
                                </span>
                                <span className="text-muted-foreground">{complianceDistribution.compliant} ({kpis.totalAudits > 0 ? Math.round((complianceDistribution.compliant / kpis.totalAudits) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                    style={{ width: `${kpis.totalAudits > 0 ? (complianceDistribution.compliant / kpis.totalAudits) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Non-Compliant */}
                        <div>
                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                <span className="text-red-400 flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-500" /> Non-Compliant
                                </span>
                                <span className="text-muted-foreground">{complianceDistribution.non_compliant} ({kpis.totalAudits > 0 ? Math.round((complianceDistribution.non_compliant / kpis.totalAudits) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full transition-all duration-700"
                                    style={{ width: `${kpis.totalAudits > 0 ? (complianceDistribution.non_compliant / kpis.totalAudits) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Needs Review */}
                        <div>
                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                <span className="text-amber-400 flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" /> Needs Review
                                </span>
                                <span className="text-muted-foreground">{complianceDistribution.needs_review} ({kpis.totalAudits > 0 ? Math.round((complianceDistribution.needs_review / kpis.totalAudits) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                                    style={{ width: `${kpis.totalAudits > 0 ? (complianceDistribution.needs_review / kpis.totalAudits) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Intent Routing Breakdown */}
                <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <TrendingUp className="h-5 w-5 text-amber-400" />
                            <h3 className="text-base font-semibold text-foreground">Agent Intent Classification</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                            <p className="text-xs text-muted-foreground font-medium">Compliance Audit</p>
                            <h4 className="text-xl font-bold text-foreground mt-1">{intentDistribution.compliance_audit}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Full verification pipeline</p>
                        </div>

                        <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                            <p className="text-xs text-muted-foreground font-medium">SOP Explanation</p>
                            <h4 className="text-xl font-bold text-foreground mt-1">{intentDistribution.sop_explanation}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Plain-language guides</p>
                        </div>

                        <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                            <p className="text-xs text-muted-foreground font-medium">SOP Search</p>
                            <h4 className="text-xl font-bold text-foreground mt-1">{intentDistribution.sop_search}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Document lookup</p>
                        </div>

                        <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                            <p className="text-xs text-muted-foreground font-medium">Chitchat / General</p>
                            <h4 className="text-xl font-bold text-foreground mt-1">{intentDistribution.chitchat}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Greetings & meta queries</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 3. Department Breakdown & Document Insights ───────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department Usage Table */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-white/10 space-y-4">
                    <div className="flex items-center gap-2.5">
                        <Users className="h-5 w-5 text-blue-400" />
                        <h3 className="text-base font-semibold text-foreground">Department Token & Usage Breakdown</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <th className="pb-3 px-2">Department</th>
                                    <th className="pb-3 px-2 text-right">Audits</th>
                                    <th className="pb-3 px-2 text-right">Est. Tokens</th>
                                    <th className="pb-3 px-2 text-right">Est. Cost</th>
                                    <th className="pb-3 px-2 text-right">Escalations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {departmentBreakdown.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-xs text-muted-foreground">
                                            No department usage logged yet.
                                        </td>
                                    </tr>
                                ) : (
                                    departmentBreakdown.map((dept) => (
                                        <tr key={dept.department} className="hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-2 font-medium text-foreground">{dept.department}</td>
                                            <td className="py-3 px-2 text-right font-mono text-muted-foreground">{dept.count}</td>
                                            <td className="py-3 px-2 text-right font-mono text-amber-400/90">{dept.totalTokens.toLocaleString()}</td>
                                            <td className="py-3 px-2 text-right font-mono text-emerald-400">${dept.costUSD.toFixed(4)}</td>
                                            <td className="py-3 px-2 text-right">
                                                {dept.escalations > 0 ? (
                                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 bg-red-500/20 text-red-400 border-red-500/30">
                                                        {dept.escalations}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground font-mono">0</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SOP Documents Analytics */}
                <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-4">
                            <FileText className="h-5 w-5 text-cyan-400" />
                            <h3 className="text-base font-semibold text-foreground">SOP Repository Analytics</h3>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3 mb-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Uploaded SOPs</span>
                                <span className="font-bold font-mono text-foreground">{documentsSummary.totalSOPDocuments}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Global Scope</span>
                                <span className="font-mono text-cyan-400">{documentsSummary.globalSOPCount}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Department Specific</span>
                                <span className="font-mono text-purple-400">{documentsSummary.deptSOPCount}</span>
                            </div>
                        </div>

                        {/* Top Cited Documents */}
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                            Most Cited SOPs
                        </h4>
                        {topCites.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No SOP citations recorded yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {topCites.map((cite, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-black/20 rounded-lg border border-white/5">
                                        <span className="font-medium text-foreground/90 truncate max-w-[170px]" title={cite.title}>
                                            {cite.title}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shrink-0">
                                            {cite.count} audits
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
