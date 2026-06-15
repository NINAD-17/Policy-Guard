"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { DEPARTMENTS } from "@/lib/types";

interface UploadFormProps {
    onUploadSuccess: () => void;
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [scope, setScope] = useState<string>("global");
    const [departments, setDepartments] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please select a PDF file");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", title);
            formData.append("description", description);
            formData.append("scope", scope);
            if (scope === "department-specific" && departments.length > 0) {
                formData.append("departments", departments.join(","));
            }

            const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Upload failed");
            }

            toast.success("Document uploaded! Processing will begin shortly.");

            // Reset form
            setTitle("");
            setDescription("");
            setScope("global");
            setDepartments([]);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            onUploadSuccess();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Upload failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const toggleDepartment = (dept: string) => {
        setDepartments((prev) =>
            prev.includes(dept)
                ? prev.filter((d) => d !== dept)
                : [...prev, dept]
        );
    };

    return (
        <Card className="glass-panel bg-card/45 backdrop-blur-xl border-white/10 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.5)] rounded-[2rem] p-4 md:p-6 transition-all duration-300">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload SOP Document
                </CardTitle>
                <CardDescription className="text-muted-foreground/80">
                    Upload a PDF policy document. It will be automatically
                    processed, chunked, and indexed for AI-powered compliance
                    auditing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Code Review Guidelines"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                disabled={loading}
                                className="bg-background/50 border-white/10 h-12 rounded-xl px-4 focus-visible:ring-1 focus-visible:ring-white/20 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scope" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Scope</Label>
                            <Select
                                value={scope}
                                onValueChange={setScope}
                                disabled={loading}
                            >
                                <SelectTrigger id="scope" className="bg-background/50 border-white/10 h-12 rounded-xl px-4 focus-visible:ring-1 focus-visible:ring-white/20 transition-colors">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-panel bg-card/95 border-white/15 rounded-xl">
                                    <SelectItem value="global" className="hover:bg-white/5 focus:bg-white/5 rounded-lg">
                                        Global (all departments)
                                    </SelectItem>
                                    <SelectItem value="department-specific" className="hover:bg-white/5 focus:bg-white/5 rounded-lg">
                                        Department-specific
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {scope === "department-specific" && (
                        <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Departments</Label>
                            <div className="flex flex-wrap gap-2">
                                {DEPARTMENTS.map((dept) => (
                                    <Button
                                        key={dept}
                                        type="button"
                                        variant={
                                            departments.includes(dept)
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() => toggleDepartment(dept)}
                                        disabled={loading}
                                        className={
                                            departments.includes(dept)
                                                ? "bg-primary text-primary-foreground rounded-full px-4 h-9 shadow-md transition-all font-medium"
                                                : "border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground rounded-full px-4 h-9 transition-all font-medium"
                                        }
                                    >
                                        {dept}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of this SOP document..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            disabled={loading}
                            rows={3}
                            className="bg-background/50 border-white/10 rounded-xl px-4 py-3 focus-visible:ring-1 focus-visible:ring-white/20 resize-none transition-colors min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">PDF File</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                id="file"
                                type="file"
                                accept=".pdf"
                                ref={fileInputRef}
                                onChange={(e) =>
                                    setFile(e.target.files?.[0] || null)
                                }
                                disabled={loading}
                                className="flex-1 bg-background/50 border-white/10 h-12 rounded-xl px-4 focus-visible:ring-1 focus-visible:ring-white/20 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 file:cursor-pointer transition-colors"
                            />
                            {file && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/5 border border-white/5 rounded-xl px-3 h-12 animate-in fade-in zoom-in-95 duration-200">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span className="max-w-[150px] truncate text-xs font-medium text-foreground">
                                        {file.name}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-full hover:bg-white/10 hover:text-foreground text-muted-foreground transition-all ml-1"
                                        onClick={() => {
                                            setFile(null);
                                            if (fileInputRef.current)
                                                fileInputRef.current.value = "";
                                        }}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Button type="submit" disabled={loading || !file} className="w-full md:w-auto h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] cursor-pointer">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Document
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
