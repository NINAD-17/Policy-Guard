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
        <div className="space-y-3">
            {/* ── User Query Bubble ──────────────────────────────────── */}
            <div className="flex justify-end">
                <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-3 w-3 opacity-70" />
                        <span className="text-xs opacity-70">Your query</span>
                    </div>
                    <p className="text-sm">{log.userQuery}</p>

                    {/* Expandable attached text */}
                    {log.userText && (
                        <div className="mt-2 pt-2 border-t border-primary-foreground/20">
                            {textExpanded ? (
                                <>
                                    <p className="text-xs whitespace-pre-wrap opacity-90">
                                        {log.userText}
                                    </p>
                                    <button
                                        onClick={() => setTextExpanded(false)}
                                        className="text-xs mt-1 opacity-70 hover:opacity-100 flex items-center gap-1 transition-opacity"
                                    >
                                        <ChevronUp className="h-3 w-3" />
                                        Collapse
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setTextExpanded(true)}
                                    className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1 transition-opacity"
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
            <div className="flex justify-start">
                <Card className="max-w-[90%] bg-muted/30 border-border/50">
                    {/* Status + Confidence Header */}
                    <CardHeader className="pb-3 pt-4 px-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <StatusIcon className="h-4 w-4" />
                                <Badge className={config.color}>
                                    {config.label}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground">
                                    Confidence
                                </div>
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${confidencePercent >= 80
                                                ? "bg-emerald-500"
                                                : confidencePercent >= 60
                                                    ? "bg-yellow-500"
                                                    : "bg-red-500"
                                            }`}
                                        style={{
                                            width: `${confidencePercent}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-xs font-mono">
                                    {confidencePercent}%
                                </span>
                            </div>
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-4 px-4 pb-4">
                        {structured ? (
                            /* ── Structured Layout ──────────────────── */
                            <div className="space-y-4">
                                {/* Summary */}
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {report.summary}
                                </p>

                                {/* Findings */}
                                {report.findings.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Findings
                                            {nonCompliantCount > 0 && (
                                                <span className="ml-2 text-red-400 normal-case tracking-normal">
                                                    ({nonCompliantCount} of{" "}
                                                    {report.findings.length}{" "}
                                                    non-compliant)
                                                </span>
                                            )}
                                        </h4>
                                        <div className="space-y-2">
                                            {report.findings.map((finding, i) => (
                                                <div
                                                    key={i}
                                                    className={`rounded-lg border p-3 ${finding.status === "compliant"
                                                            ? "border-emerald-800/30 bg-emerald-950/20"
                                                            : "border-red-800/30 bg-red-950/20"
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        {finding.status ===
                                                            "compliant" ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-sm font-medium">
                                                                    {finding.title}
                                                                </span>
                                                                {/* Inline source badges */}
                                                                {finding.sopReferences.map(
                                                                    (ref) => (
                                                                        <span
                                                                            key={ref}
                                                                            className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-muted text-[10px] font-mono text-muted-foreground"
                                                                        >
                                                                            {ref}
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Lightbulb className="h-3 w-3" />
                                            Recommendations
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {report.recommendations.map(
                                                (rec, i) => (
                                                    <li
                                                        key={i}
                                                        className="text-sm text-muted-foreground flex gap-2"
                                                    >
                                                        <span className="text-primary mt-0.5">
                                                            •
                                                        </span>
                                                        <span className="leading-relaxed">
                                                            {rec}
                                                        </span>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {/* Sources — Perplexity-style collapsible */}
                                {isStructuredSources(log.sourcesUsed) &&
                                    log.sourcesUsed.length > 0 && (
                                        <div>
                                            <button
                                                onClick={() =>
                                                    setSourcesExpanded(
                                                        !sourcesExpanded
                                                    )
                                                }
                                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <FileText className="h-3 w-3" />
                                                <span>
                                                    Sources (
                                                    {log.sourcesUsed.length})
                                                </span>
                                                {sourcesExpanded ? (
                                                    <ChevronUp className="h-3 w-3" />
                                                ) : (
                                                    <ChevronDown className="h-3 w-3" />
                                                )}
                                            </button>
                                            {sourcesExpanded && (
                                                <div className="mt-2 space-y-1.5">
                                                    {log.sourcesUsed.map((source, idx) => (
                                                        <div key={idx} className="flex flex-col gap-1 w-full bg-muted/50 rounded-md p-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleOpenSource(
                                                                        source.documentId
                                                                    )
                                                                }
                                                                className="w-full flex items-center gap-2 text-left group"
                                                            >
                                                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                                                <span className="text-xs flex-1 truncate font-medium">
                                                                    {
                                                                        source.documentTitle
                                                                    }
                                                                    {source.pageNumber ? ` (Page ${source.pageNumber})` : ""}
                                                                </span>
                                                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        ) : (
                            /* ── Markdown Fallback (old logs) ──────── */
                            <div className="prose prose-sm prose-invert max-w-none [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:text-sm [&_p]:text-muted-foreground [&_li]:text-sm [&_li]:text-muted-foreground [&_strong]:text-foreground [&_ul]:my-1 [&_ol]:my-1">
                                <ReactMarkdown>
                                    {report as string}
                                </ReactMarkdown>
                            </div>
                        )}

                        {/* Tags */}
                        {log.tags && log.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border/50">
                                {log.tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Escalation Block */}
                        {log.escalated && (
                            <div className="mt-4 pt-4 border-t border-red-900/30">
                                <div className="rounded-md border border-red-900/50 bg-red-950/20 p-3">
                                    <h4 className="text-sm font-semibold text-red-500 mb-1 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Escalated to {log.escalatedToName || "Manager"}
                                    </h4>
                                    <p className="text-xs text-muted-foreground italic bg-black/20 p-2 rounded border border-white/5">
                                        "{log.escalationMessage}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-muted-foreground mt-3">
                            {new Date(log.createdAt).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
