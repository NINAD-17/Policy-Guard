"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AuditFeed } from "@/components/audit-feed";
import { ChatInput } from "@/components/chat-input";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { AuditLogEntry } from "@/components/audit-card";

export default function DashboardPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const logCountRef = useRef(0);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await fetch("/api/audit-logs?limit=50");
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                return data.logs.length;
            }
        } catch {
            console.error("Failed to fetch audit logs");
        }
        return 0;
    }, []);

    // Initial load
    useEffect(() => {
        fetchLogs().then((count) => {
            logCountRef.current = count;
            setLoading(false);
        });
    }, [fetchLogs]);

    // Polling while processing
    useEffect(() => {
        if (processing) {
            pollRef.current = setInterval(async () => {
                const newCount = await fetchLogs();
                if (newCount > logCountRef.current) {
                    // New result arrived
                    logCountRef.current = newCount;
                    setProcessing(false);
                    toast.success("Audit report ready!");
                }
            }, 5000); // Poll every 5 seconds
        }

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [processing, fetchLogs]);

    const handleSubmit = async (query: string, text: string) => {
        setProcessing(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, text }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit query");
            }

            toast.info("Query submitted! Agents are working on it...");
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to submit"
            );
            setProcessing(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col w-full h-full relative">
            {/* Floating Header */}


            {/* Audit feed container with padding for floating header and footer */}
            <div className="flex-1 overflow-y-auto pt-16 relative">
                <AuditFeed logs={logs} loading={loading} processing={processing} />
                <div className="h-40 shrink-0 w-full" />
            </div>

            {/* Floating Chat input */}
            <ChatInput onSubmit={handleSubmit} loading={processing} />
        </div>
    );
}
