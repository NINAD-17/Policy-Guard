"use client";

import { useRef, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditCard, type AuditLogEntry } from "@/components/audit-card";
import { ShieldCheck } from "lucide-react";

interface AuditFeedProps {
    logs: AuditLogEntry[];
    loading: boolean;
    processing: boolean;
}

export function AuditFeed({ logs, loading, processing }: AuditFeedProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const initialRenderRef = useRef(true);

    // Auto-scroll to bottom when new logs arrive without shifting window/body viewport
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!bottomRef.current) return;
            let parent = bottomRef.current.parentElement;
            while (parent) {
                const hasScrollableContent = parent.scrollHeight > parent.clientHeight;
                const overflowY = window.getComputedStyle(parent).overflowY;
                const isScrollableStyle = overflowY === "auto" || overflowY === "scroll";
                
                if (hasScrollableContent && isScrollableStyle) {
                    parent.scrollTo({
                        top: parent.scrollHeight,
                        behavior: initialRenderRef.current ? "auto" : "smooth",
                    });
                    if (logs.length > 0) {
                        initialRenderRef.current = false;
                    }
                    break;
                }
                parent = parent.parentElement;
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [logs.length, processing]);

    if (loading) {
        return (
            <div className="flex-1 p-6 space-y-4 max-w-5xl mx-auto w-full">
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

    const completedLogs = logs.filter((log) => log.status !== "processing");
    const activeProcessingLog = logs.find((log) => log.status === "processing");
    const isProcessing = !!activeProcessingLog || (processing && logs.length === 0);
    const currentStepMessage =
        activeProcessingLog?.currentStep || "AI agents are analyzing your submission...";

    return (
        <div className="w-full">
            <div className="p-6 space-y-8 max-w-5xl mx-auto w-full">
                {completedLogs.length === 0 && !isProcessing ? (
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
                        {completedLogs.map((log) => (
                            <AuditCard key={log._id} log={log} />
                        ))}
                    </>
                )}

                {/* Live Dynamic Agent Status Indicator */}
                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-muted/40 border border-primary/30 rounded-xl px-5 py-3.5 flex items-center gap-3 shadow-sm backdrop-blur-sm animate-pulse">
                            <div className="flex space-x-1.5">
                                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                            <span className="text-sm font-medium text-primary">
                                {currentStepMessage}
                            </span>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </div>
    );
}
