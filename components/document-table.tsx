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
                    <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 rounded-full px-2.5 py-0.5 font-semibold text-[10px] tracking-wide">
                        Active
                    </Badge>
                );
            case "processing":
                return (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15 rounded-full px-2.5 py-0.5 font-semibold text-[10px] tracking-wide animate-pulse">
                        Processing
                    </Badge>
                );
            case "archived":
                return (
                    <Badge variant="outline" className="border-white/10 hover:bg-white/5 text-muted-foreground rounded-full px-2.5 py-0.5 font-semibold text-[10px] tracking-wide">
                        Archived
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="border-white/10 hover:bg-white/5 text-muted-foreground rounded-full px-2.5 py-0.5 font-semibold text-[10px] tracking-wide">
                        {status}
                    </Badge>
                );
        }
    };

    return (
        <>
            <Card className="glass-panel bg-card/45 backdrop-blur-xl border-white/10 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.5)] rounded-[2rem] p-4 md:p-6 mt-6 transition-all duration-300">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                        <FileText className="h-5 w-5 text-primary" />
                        SOP Documents
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
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
                                    className="h-16 w-full rounded-2xl bg-white/5"
                                />
                            ))}
                        </div>
                    ) : documents.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-12">
                            No documents uploaded yet. Use the form above to
                            upload your first SOP.
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {documents.map((doc, i) => (
                                <div key={doc._id}>
                                    <div className="flex items-center justify-between py-4 px-3 rounded-2xl hover:bg-white/5 transition-all duration-300 group">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2.5 mb-1.5">
                                                <h3 className="font-semibold text-sm truncate text-foreground/90">
                                                    {doc.title}
                                                </h3>
                                                {statusBadge(doc.status)}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground/80">
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    {doc.scope === "global" ? (
                                                        <Globe className="h-3.5 w-3.5 text-primary" />
                                                    ) : (
                                                        <Building2 className="h-3.5 w-3.5 text-primary" />
                                                    )}
                                                    {doc.scope === "global"
                                                        ? "Global"
                                                        : doc.departments.join(
                                                            ", "
                                                        )}
                                                </span>
                                                <span className="font-medium">
                                                    {new Date(
                                                        doc.createdAt
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all duration-300 opacity-80 group-hover:opacity-100"
                                            onClick={() =>
                                                setDeleteId(doc._id)
                                            }
                                        >
                                            <Trash2 className="h-4.5 w-4.5" />
                                        </Button>
                                    </div>
                                    {i < documents.length - 1 && <Separator className="bg-white/5 my-1" />}
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
                <DialogContent className="glass-panel bg-card/95 border-white/15 rounded-3xl p-6 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Delete Document</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground/80 mt-1.5 leading-relaxed">
                            This will permanently delete the document, all its
                            chunks, and the S3 file. This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                            disabled={deleting}
                            className="rounded-xl border-white/10 hover:bg-white/5 font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold px-5"
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
