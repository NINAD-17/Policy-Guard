"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, ChevronUp, ChevronDown } from "lucide-react";

interface ChatInputProps {
    onSubmit: (query: string, text: string) => void;
    loading: boolean;
}

export function ChatInput({ onSubmit, loading }: ChatInputProps) {
    const [query, setQuery] = useState("");
    const [text, setText] = useState("");
    const [expanded, setExpanded] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        onSubmit(query.trim(), text.trim());
        setQuery("");
        setText("");
        setExpanded(false);
    };

    return (
        <div className="border-t border-border bg-card p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
                {/* Expandable text area for work text */}
                {expanded && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-muted-foreground">
                                Paste your work text for audit (optional)
                            </label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => setExpanded(false)}
                            >
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Collapse
                            </Button>
                        </div>
                        <Textarea
                            placeholder="Paste code, document text, or process description you want audited..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={4}
                            disabled={loading}
                            className="resize-none"
                        />
                    </div>
                )}

                {/* Main input row */}
                <div className="flex items-center gap-2">
                    {!expanded && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={() => setExpanded(true)}
                            title="Attach work text"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </Button>
                    )}
                    <Input
                        placeholder="Ask a compliance question..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={loading}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={loading || !query.trim()}
                        size="icon"
                        className="h-10 w-10 shrink-0"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
