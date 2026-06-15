"use client";

import { useState, useEffect, useCallback } from "react";
import { UploadForm } from "@/components/upload-form";
import { DocumentTable } from "@/components/document-table";

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
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

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
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                    Document Management
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                    Upload and manage Standard Operating Procedure documents.
                </p>
            </div>

            <UploadForm onUploadSuccess={fetchDocuments} />

            <DocumentTable
                documents={documents}
                loading={loading}
                onDelete={fetchDocuments}
            />
        </div>
    );
}
