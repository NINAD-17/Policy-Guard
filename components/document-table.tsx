"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { FileText, Trash2, Globe, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Document {
    _id: string;
    title: string;
    description: string;
    scope: string;
    departments: string[];
    status: string;
    createdAt: string;
}

interface DocumentTableProps {
    documents: Document[];
    loading: boolean;
    onDelete: () => void;
}

export function DocumentTable({
    documents,
    loading,
    onDelete,
}: DocumentTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/documents/${deleteId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Document deleted");
            setDeleteId(null);
            onDelete();
        } catch {
            toast.error("Failed to delete document");
        } finally {
            setDeleting(false);
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <Badge variant="default" className="bg-emerald-600">
                        Active
                    </Badge>
                );
            case "processing":
                return (
                    <Badge variant="secondary" className="text-yellow-500">
                        Processing
                    </Badge>
                );
            case "archived":
                return <Badge variant="outline">Archived</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        SOP Documents
                    </CardTitle>
                    <CardDescription>
                        {documents.length} document
                        {documents.length !== 1 ? "s" : ""} uploaded
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-16 w-full rounded-lg"
                                />
                            ))}
                        </div>
                    ) : documents.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-8">
                            No documents uploaded yet. Use the form above to
                            upload your first SOP.
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {documents.map((doc, i) => (
                                <div key={doc._id}>
                                    <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-sm truncate">
                                                    {doc.title}
                                                </h3>
                                                {statusBadge(doc.status)}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    {doc.scope === "global" ? (
                                                        <Globe className="h-3 w-3" />
                                                    ) : (
                                                        <Building2 className="h-3 w-3" />
                                                    )}
                                                    {doc.scope === "global"
                                                        ? "Global"
                                                        : doc.departments.join(
                                                            ", "
                                                        )}
                                                </span>
                                                <span>
                                                    {new Date(
                                                        doc.createdAt
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                setDeleteId(doc._id)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {i < documents.length - 1 && <Separator />}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete confirmation dialog */}
            <Dialog
                open={!!deleteId}
                onOpenChange={() => !deleting && setDeleteId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Document</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the document, all its
                            chunks, and the S3 file. This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
