"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditCard } from "@/components/audit-card";
import { ShieldCheck } from "lucide-react";

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

interface AuditFeedProps {
    logs: AuditLog[];
    loading: boolean;
    processing: boolean;
}

export function AuditFeed({ logs, loading, processing }: AuditFeedProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs.length, processing]);

    if (loading) {
        return (
            <div className="flex-1 p-6 space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="space-y-3">
                        <div className="flex justify-end">
                            <Skeleton className="h-16 w-64 rounded-2xl" />
                        </div>
                        <div className="flex justify-start">
                            <Skeleton className="h-48 w-[80%] rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
                {logs.length === 0 && !processing ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                        <ShieldCheck className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground">
                            No audit reports yet
                        </h3>
                        <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
                            Submit a compliance question below to get started.
                            Paste your work text for a detailed audit against
                            company SOPs.
                        </p>
                    </div>
                ) : (
                    <>
                        {logs.map((log) => (
                            <AuditCard key={log._id} log={log} />
                        ))}
                    </>
                )}

                {/* Processing indicator */}
                {processing && (
                    <div className="flex justify-start">
                        <div className="bg-muted/30 border border-border/50 rounded-lg px-4 py-3 flex items-center gap-3">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                                AI agents are analyzing your submission...
                            </span>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    );
}
