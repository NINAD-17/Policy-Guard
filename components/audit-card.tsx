"use client";

import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

interface AuditLog {
    _id: string;
    userQuery: string;
    userText: string;
    auditReport: string;
    confidenceScore: number;
    status: string;
    tags: string[];
    createdAt: string;
}

interface AuditCardProps {
    log: AuditLog;
}

export function AuditCard({ log }: AuditCardProps) {
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

    const config = statusConfig[log.status as keyof typeof statusConfig] || {
        icon: AlertTriangle,
        label: log.status,
        color: "bg-muted",
    };
    const StatusIcon = config.icon;

    const confidencePercent = Math.round(log.confidenceScore * 100);

    return (
        <div className="space-y-3">
            {/* User query bubble */}
            <div className="flex justify-end">
                <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-3 w-3 opacity-70" />
                        <span className="text-xs opacity-70">Your query</span>
                    </div>
                    <p className="text-sm">{log.userQuery}</p>
                    {log.userText && (
                        <p className="text-xs mt-1 opacity-70 line-clamp-2">
                            📎 {log.userText.substring(0, 100)}
                            {log.userText.length > 100 ? "..." : ""}
                        </p>
                    )}
                </div>
            </div>

            {/* AI response card */}
            <div className="flex justify-start">
                <Card className="max-w-[90%] bg-muted/30 border-border/50">
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
                        {/* Markdown rendered audit report */}
                        <div className="prose prose-sm prose-invert max-w-none [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:text-sm [&_p]:text-muted-foreground [&_li]:text-sm [&_li]:text-muted-foreground [&_strong]:text-foreground [&_ul]:my-1 [&_ol]:my-1">
                            <ReactMarkdown>{log.auditReport}</ReactMarkdown>
                        </div>

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
