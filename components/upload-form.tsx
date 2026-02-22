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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload SOP Document
                </CardTitle>
                <CardDescription>
                    Upload a PDF policy document. It will be automatically
                    processed, chunked, and indexed for AI-powered compliance
                    auditing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Code Review Guidelines"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scope">Scope</Label>
                            <Select
                                value={scope}
                                onValueChange={setScope}
                                disabled={loading}
                            >
                                <SelectTrigger id="scope">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">
                                        Global (all departments)
                                    </SelectItem>
                                    <SelectItem value="department-specific">
                                        Department-specific
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {scope === "department-specific" && (
                        <div className="space-y-2">
                            <Label>Departments</Label>
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
                                    >
                                        {dept}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of this SOP document..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            disabled={loading}
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file">PDF File</Label>
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
                                className="flex-1"
                            />
                            {file && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    <span className="max-w-[150px] truncate">
                                        {file.name}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => {
                                            setFile(null);
                                            if (fileInputRef.current)
                                                fileInputRef.current.value = "";
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Button type="submit" disabled={loading || !file}>
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
