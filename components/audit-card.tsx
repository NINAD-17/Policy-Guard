"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    FileText,
    ExternalLink,
    Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface AuditFinding {
    title: string;
    description: string;
    status: "compliant" | "non_compliant";
    sopReferences: number[];
}

interface AuditSource {
    index: number;
    documentTitle: string;
    documentId: string;
    pageNumber?: number;
}

interface AuditReportStructured {
    summary: string;
    findings: AuditFinding[];
    recommendations: string[];
}

export interface AuditLogEntry {
    _id: string;
    userQuery: string;
    userText: string;
    auditReport: string | AuditReportStructured;
    confidenceScore: number;
    sourcesUsed: string[] | AuditSource[];
    status: string;
    tags: string[];
    escalated?: boolean;
    escalatedToName?: string;
    escalationMessage?: string;
    createdAt: string;
}

// ── Helper: check if auditReport is structured ──────────────────────────────

function isStructured(
    report: string | AuditReportStructured
): report is AuditReportStructured {
    return typeof report === "object" && report !== null && "summary" in report;
}

function isStructuredSources(
    sources: string[] | AuditSource[]
): sources is AuditSource[] {
    return sources.length > 0 && typeof sources[0] === "object";
}

// ── Status Config ───────────────────────────────────────────────────────────

const statusConfig = {
    compliant: {
        icon: CheckCircle2,
        label: "Compliant",
        color: "bg-emerald-600",
    },
    non_compliant: {
        icon: XCircle,
        label: "Non-Compliant",
        color: "bg-red-600",
    },
    needs_review: {
        icon: AlertTriangle,
        label: "Needs Review",
        color: "bg-yellow-600",
    },
};

// ── Main Component ──────────────────────────────────────────────────────────

interface AuditCardProps {
    log: AuditLogEntry;
}

export function AuditCard({ log }: AuditCardProps) {
    const [textExpanded, setTextExpanded] = useState(false);
    const [sourcesExpanded, setSourcesExpanded] = useState(false);

    // Cache presigned URLs per document ID
    const [urlCache, setUrlCache] = useState<Record<string, string>>({});

    const config = statusConfig[log.status as keyof typeof statusConfig] || {
        icon: AlertTriangle,
        label: log.status,
        color: "bg-muted",
    };
    const StatusIcon = config.icon;
    const confidencePercent = Math.round(log.confidenceScore * 100);

    const report = log.auditReport;
    const structured = isStructured(report);

    // Count non-compliant findings
    const nonCompliantCount = structured
        ? report.findings.filter((f) => f.status === "non_compliant").length
        : 0;

    const handleOpenSource = async (docId: string) => {
        // Use cached URL if available
        if (urlCache[docId]) {
            window.open(urlCache[docId], "_blank");
            return;
        }

        try {
            const res = await fetch(`/api/documents/${docId}/url`);
            if (!res.ok) throw new Error();
            const { url } = await res.json();

            // Cache the URL
            setUrlCache((prev) => ({ ...prev, [docId]: url }));
            window.open(url, "_blank");
        } catch {
            toast.error("Failed to open document");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── User Query Bubble ──────────────────────────────────── */}
            <div className="flex justify-end">
                <div className="max-w-[85%] md:max-w-[70%] glass bg-primary/10 border-primary/20 rounded-3xl rounded-br-sm px-5 py-4 shadow-lg shadow-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-primary opacity-80" />
                        <span className="text-xs font-medium tracking-wide text-primary opacity-80 uppercase">Your query</span>
                    </div>
                    <p className="text-sm md:text-base leading-relaxed text-foreground">{log.userQuery}</p>

                    {/* Expandable attached text */}
                    {log.userText && (
                        <div className="mt-3 pt-3 border-t border-primary/10">
                            {textExpanded ? (
                                <>
                                    <p className="text-xs md:text-sm whitespace-pre-wrap text-muted-foreground/90 font-mono bg-background/50 p-3 rounded-xl border border-white/5">
                                        {log.userText}
                                    </p>
                                    <button
                                        onClick={() => setTextExpanded(false)}
                                        className="text-xs mt-2 text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium"
                                    >
                                        <ChevronUp className="h-3 w-3" />
                                        Collapse
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setTextExpanded(true)}
                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors bg-background/40 px-3 py-1.5 rounded-full border border-white/5"
                                >
                                    <ChevronDown className="h-3 w-3" />
                                    📎 Show attached text ({log.userText.length} chars)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── AI Response Card ───────────────────────────────────── */}
            <div className="flex justify-start mt-2">
                <div className="w-full md:max-w-[90%] glass-panel rounded-[2rem] rounded-tl-sm border-white/10 overflow-hidden relative shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]">
                    {/* Subtle top gradient glow depending on status */}
                    <div className={`absolute top-0 left-0 w-full h-1 ${config.color} opacity-80`} />
                    
                    {/* Status + Confidence Header */}
                    <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-2xl ${config.color} bg-opacity-20 backdrop-blur-md border border-white/5 shadow-inner`}>
                                <StatusIcon className={`h-5 w-5 ${config.color.replace('bg-', 'text-')}`} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">PolicyGuard Audit</span>
                                <div className={`inline-flex w-max items-center px-2.5 py-0.5 rounded-full text-sm font-semibold border ${config.color.replace('bg-', 'text-')} border-${config.color.replace('bg-', '')}/30 bg-${config.color.replace('bg-', '')}/10 shadow-sm`}>
                                    {config.label}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Confidence
                            </div>
                            <div className="w-24 h-2 bg-background/50 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${confidencePercent >= 80
                                            ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            : confidencePercent >= 60
                                                ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                                                : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                        }`}
                                    style={{
                                        width: `${confidencePercent}%`,
                                    }}
                                />
                            </div>
                            <span className="text-sm font-mono font-bold text-foreground/90">
                                {confidencePercent}%
                            </span>
                        </div>
                    </div>

                    <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-b from-background/5 to-transparent">
                        {structured ? (
                            /* ── Structured Layout ──────────────────── */
                            <div className="space-y-8">
                                {/* Summary */}
                                <div className="prose prose-sm prose-invert max-w-none">
                                    <p className="text-[15px] text-foreground/90 leading-relaxed font-medium">
                                        {report.summary}
                                    </p>
                                </div>

                                {/* Findings */}
                                {report.findings.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                            Key Findings
                                            {nonCompliantCount > 0 && (
                                                <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0 bg-red-500/20 text-red-400 border-red-500/30">
                                                    {nonCompliantCount} Issues
                                                </Badge>
                                            )}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {report.findings.map((finding, i) => (
                                                <div
                                                    key={i}
                                                    className={`relative rounded-[1.5rem] p-5 transition-all duration-300 hover:-translate-y-0.5 border backdrop-blur-md shadow-sm ${finding.status === "compliant"
                                                            ? "bg-emerald-950/20 border-emerald-500/10 hover:border-emerald-500/20 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]"
                                                            : "bg-red-950/20 border-red-500/10 hover:border-red-500/20 hover:shadow-[0_8px_30px_rgba(239,68,68,0.1)]"
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${finding.status === "compliant" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                                                            {finding.status === "compliant" ? (
                                                                <CheckCircle2 className="h-5 w-5 drop-shadow-md" />
                                                            ) : (
                                                                <XCircle className="h-5 w-5 drop-shadow-md" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                                                                <span className="text-base font-semibold tracking-tight text-foreground/90">
                                                                    {finding.title}
                                                                </span>
                                                                {/* Inline source badges */}
                                                                <div className="flex gap-1.5">
                                                                    {finding.sopReferences.map((ref) => (
                                                                        <span
                                                                            key={ref}
                                                                            className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-black/40 border border-white/5 shadow-inner text-[10px] font-mono font-medium text-muted-foreground"
                                                                            title={`Reference SOP ${ref}`}
                                                                        >
                                                                            SOP-{ref}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <p className="text-[14px] text-muted-foreground leading-relaxed">
                                                                {finding.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {report.recommendations.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                                            Recommendations
                                        </h4>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                                            <ul className="space-y-3">
                                                {report.recommendations.map(
                                                    (rec, i) => (
                                                        <li
                                                            key={i}
                                                            className="text-[14.5px] text-foreground/80 flex gap-3 items-start"
                                                        >
                                                            <Lightbulb className="h-4 w-4 text-yellow-500/70 mt-0.5 shrink-0" />
                                                            <span className="leading-relaxed">
                                                                {rec}
                                                            </span>
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Sources */}
                                {isStructuredSources(log.sourcesUsed) &&
                                    log.sourcesUsed.length > 0 && (
                                        <div className="pt-2">
                                            <button
                                                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                                                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5"
                                            >
                                                <FileText className="h-3.5 w-3.5" />
                                                <span>Sources ({log.sourcesUsed.length})</span>
                                                {sourcesExpanded ? (
                                                    <ChevronUp className="h-3.5 w-3.5 ml-1" />
                                                ) : (
                                                    <ChevronDown className="h-3.5 w-3.5 ml-1" />
                                                )}
                                            </button>
                                            {sourcesExpanded && (
                                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {log.sourcesUsed.map((source, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleOpenSource(source.documentId)}
                                                            className="flex items-center gap-3 text-left group bg-black/20 hover:bg-white/5 border border-white/5 rounded-2xl p-3 transition-all duration-300"
                                                        >
                                                            <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0 group-hover:scale-110 transition-transform">
                                                                <FileText className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span className="text-sm font-medium text-foreground/90 truncate">
                                                                    {source.documentTitle}
                                                                </span>
                                                                {source.pageNumber && (
                                                                    <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                                                                        Page {source.pageNumber}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        ) : (
                            /* ── Markdown Fallback (old logs) ──────── */
                            <div className="prose prose-sm prose-invert max-w-none [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:text-[15px] [&_p]:text-foreground/90 [&_p]:leading-relaxed [&_li]:text-[14px] [&_li]:text-foreground/80 [&_strong]:text-foreground [&_ul]:my-2 [&_ol]:my-2">
                                <ReactMarkdown>
                                    {report as string}
                                </ReactMarkdown>
                            </div>
                        )}

                        {/* Footer (Tags, Escalation, Timestamp) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/5">
                            <div className="flex items-center gap-4 flex-wrap">
                                {/* Tags */}
                                {log.tags && log.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {log.tags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="outline"
                                                className="text-[10px] uppercase tracking-widest bg-white/5 border-white/10 text-muted-foreground"
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Escalation Block */}
                                {log.escalated && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/10">
                                        <AlertTriangle className="h-3 w-3 text-red-400" />
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">
                                            Escalated: {log.escalatedToName || "Manager"}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-widest whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString()}
                            </span>
                        </div>

                        {log.escalated && log.escalationMessage && (
                            <div className="mt-4 rounded-2xl border border-red-500/10 bg-red-950/20 p-4">
                                <p className="text-sm text-red-200/80 italic leading-relaxed">
                                    "{log.escalationMessage}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
