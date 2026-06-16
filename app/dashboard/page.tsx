"use client";

import { useState, useEffect, useRef } from "react";
import { AuditFeed } from "@/components/audit-feed";
import { ChatInput } from "@/components/chat-input";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { AuditLogEntry } from "@/components/audit-card";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
});

export default function DashboardPage() {
    const [processing, setProcessing] = useState(false);
    const logCountRef = useRef(0);

    const { data, isLoading: loading, error } = useSWR(
        "/api/audit-logs?limit=50",
        fetcher,
        {
            refreshInterval: processing ? 5000 : 0, // Automatically poll every 5s if processing
            revalidateOnFocus: true
        }
    );

    const logs: AuditLogEntry[] = data?.logs || [];

    // Track when new logs arrive to stop processing
    useEffect(() => {
        if (logs.length > 0) {
            if (processing && logs.length > logCountRef.current) {
                setProcessing(false);
                toast.success("Audit report ready!");
            }
            logCountRef.current = logs.length;
        }
    }, [logs, processing]);

    useEffect(() => {
        if (error) {
            toast.error("Failed to fetch audit logs");
        }
    }, [error]);

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
