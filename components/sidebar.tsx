"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ShieldCheck,
    LogOut,
    FileText,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface Document {
    _id: string;
    title: string;
    scope: string;
    departments: string[];
    status: string;
}

export function Sidebar() {
    const router = useRouter();
    const { data: session } = useSession();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        async function fetchDocs() {
            try {
                const res = await fetch("/api/documents");
                if (res.ok) {
                    const data = await res.json();
                    setDocuments(data.filter((d: Document) => d.status === "active"));
                }
            } catch {
                console.error("Failed to fetch documents");
            } finally {
                setLoading(false);
            }
        }
        fetchDocs();
    }, []);

    const handleViewPDF = async (docId: string) => {
        try {
            const res = await fetch(`/api/documents/${docId}/url`);
            if (!res.ok) throw new Error();
            const { url } = await res.json();
            window.open(url, "_blank");
        } catch {
            toast.error("Failed to open document");
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    };

    if (collapsed) {
        return (
            <div className="w-14 border-r border-border bg-card flex flex-col items-center py-4 gap-4 shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCollapsed(false)}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="w-72 border-r border-border bg-card flex flex-col shrink-0">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">PolicyGuard</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCollapsed(true)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>

            <Separator />

            {/* User info */}
            <div className="p-4">
                <p className="text-sm font-medium truncate">
                    {session?.user?.name || "Employee"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                        {session?.user?.department || "—"}
                    </Badge>
                </div>
            </div>

            <Separator />

            {/* Documents */}
            <div className="p-4 pb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    SOP Documents
                </h3>
            </div>

            <ScrollArea className="flex-1 px-2">
                {loading ? (
                    <div className="space-y-2 px-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                ) : documents.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-4 py-2">
                        No documents available
                    </p>
                ) : (
                    <div className="space-y-0.5">
                        {documents.map((doc) => (
                            <button
                                key={doc._id}
                                onClick={() => handleViewPDF(doc._id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm hover:bg-muted/50 transition-colors group"
                            >
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate flex-1">
                                    {doc.title}
                                </span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Logout */}
            <div className="p-3 mt-auto border-t border-border">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
