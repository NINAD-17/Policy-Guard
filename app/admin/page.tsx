"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { UploadForm } from "@/components/upload-form";
import { DocumentTable } from "@/components/document-table";
import { AdminStats } from "@/components/admin-stats";
import { Library, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
    _id: string;
    title: string;
    description: string;
    scope: string;
    departments: string[];
    status: string;
    createdAt: string;
}

export default function AdminPage() {
    const { data: session } = useSession();
    const isGuest = session?.user?.email === "guest@policypulse.dev";

    const [activeTab, setActiveTab] = useState<"documents" | "stats">("documents");
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    // Default guest users to the Analytics & Tokens tab
    useEffect(() => {
        if (isGuest) {
            setActiveTab("stats");
        }
    }, [isGuest]);

    const fetchDocuments = useCallback(async () => {
        try {
            const res = await fetch("/api/documents");
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Smart polling: poll every 5 seconds only when any document has status === "processing"
    useEffect(() => {
        const hasProcessing = documents.some((doc) => doc.status === "processing");
        let interval: NodeJS.Timeout | null = null;

        if (hasProcessing) {
            interval = setInterval(() => {
                fetchDocuments();
            }, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [documents, fetchDocuments]);

    return (
        <div className="space-y-8 max-w-5xl mx-auto pt-12 lg:pt-0">
            {/* Guest Demo Alert Banner */}
            {isGuest && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2.5">
                        <Sparkles className="h-5 w-5 shrink-0 text-amber-400" />
                        <span>
                            <strong>Guest Demo Mode:</strong> Analytics and token tracking are open for previewing. Document uploading is restricted to Admin role.
                        </span>
                    </div>
                </div>
            )}

            {/* Header + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                        {isGuest ? "Admin Analytics Demo" : "Admin Controls"}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {activeTab === "documents"
                            ? "Upload and manage company Standard Operating Procedure documents."
                            : "Monitor LLM token consumption, estimated API cost, and department analytics."}
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1.5 bg-black/30 p-1.5 rounded-2xl border border-white/10 shrink-0 self-start sm:self-auto">
                    <button
                        onClick={() => setActiveTab("documents")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer",
                            activeTab === "documents"
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Library className="h-4 w-4" />
                        <span>SOP Documents</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("stats")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer",
                            activeTab === "stats"
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics & Tokens</span>
                    </button>
                </div>
            </div>

            {/* Tab Contents */}
            {activeTab === "documents" ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                    {isGuest ? (
                        <div className="p-8 text-center glass-panel rounded-2xl border-white/10 space-y-3">
                            <Library className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                            <h3 className="text-base font-semibold text-foreground">SOP Document Management Restricted</h3>
                            <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                Document uploading and deletion require full Admin privileges. Switch to the <strong>Analytics & Tokens</strong> tab to preview live token tracking.
                            </p>
                        </div>
                    ) : (
                        <>
                            <UploadForm onUploadSuccess={fetchDocuments} />
                            <DocumentTable
                                documents={documents}
                                loading={loading}
                                onDelete={fetchDocuments}
                            />
                        </>
                    )}
                </div>
            ) : (
                <AdminStats />
            )}
        </div>
    );
}
