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

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    Document Management
                </h2>
                <p className="text-muted-foreground mt-1">
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
