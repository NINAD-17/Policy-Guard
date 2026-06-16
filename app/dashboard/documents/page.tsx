"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, FileText, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DocumentSearch } from "@/components/document-search";

interface Document {
    _id: string;
    title: string;
    scope: string;
    departments: string[];
    status: string;
    thumbnailUrl?: string;
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDocuments() {
            try {
                const res = await fetch("/api/documents");
                if (res.ok) {
                    const data = await res.json();
                    setDocuments(data.filter((d: Document) => d.status === "active"));
                }
            } catch {
                toast.error("Failed to fetch documents");
            } finally {
                setLoading(false);
            }
        }
        fetchDocuments();
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

    return (
        <div className="flex-1 flex flex-col w-full h-full relative">
            {/* Header */}
            {/* ... */}

            {/* Document Grid */}
            <div className="flex-1 overflow-y-auto pt-20 px-6 lg:p-6 relative">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="glass-panel p-8 rounded-2xl text-center border-dashed border-white/10">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">No documents available</h3>
                        <p className="text-sm text-muted-foreground mt-1">You don't have access to any active SOPs right now.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {documents.map((doc) => (
                            <button
                                key={doc._id}
                                onClick={() => handleViewPDF(doc._id)}
                                className="group relative flex flex-col text-left glass-panel rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_-10px_rgba(var(--primary),0.2)] transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Thumbnail Area */}
                                <div className="aspect-[4/3] w-full bg-muted/30 relative flex items-center justify-center overflow-hidden border-b border-white/5">
                                    {doc.thumbnailUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img 
                                            src={doc.thumbnailUrl} 
                                            alt={doc.title} 
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/20 flex flex-col items-center justify-center relative">
                                            <div className="absolute inset-0 bg-grid-white/5 bg-[size:10px_10px]" />
                                            <FileText className="h-12 w-12 text-primary/40 relative z-10" />
                                        </div>
                                    )}
                                    
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                            View PDF <ExternalLink className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Info Area */}
                                <div className="p-4 flex-1 flex flex-col justify-between w-full">
                                    <h3 className="font-semibold text-foreground/90 line-clamp-2 leading-snug mb-3">
                                        {doc.title}
                                    </h3>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 capitalize">
                                            {doc.scope === "global" ? "Global Policy" : "Departmental"}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                {/* Add padding at bottom to avoid overlap with floating search bar */}
                <div className="h-24 shrink-0 w-full" />
            </div>
            <DocumentSearch />
        </div>
    );
}
