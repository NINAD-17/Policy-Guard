"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, ChevronUp, ChevronDown, Paperclip, Plus, Mic } from "lucide-react";

interface ChatInputProps {
    onSubmit: (query: string, text: string) => void;
    loading: boolean;
}

export function ChatInput({ onSubmit, loading }: ChatInputProps) {
    const [query, setQuery] = useState("");
    const [text, setText] = useState("");
    const [expanded, setExpanded] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;
        onSubmit(query.trim(), text.trim());
        setQuery("");
        setText("");
        setExpanded(false);
        if (textareaRef.current) {
            textareaRef.current.style.height = "40px"; // reset height
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setQuery(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    };

    return (
        <div className="absolute bottom-6 left-0 right-0 mx-auto w-full max-w-3xl px-4 z-20">
            <div className="glass-panel bg-card/75 border-white/20 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.7)] rounded-[2rem] p-1.5 transition-all duration-300 focus-within:shadow-[0_8px_40px_-12px_rgba(var(--primary),0.3)] focus-within:bg-card/85 focus-within:border-white/30">
                <form onSubmit={handleSubmit} className="flex flex-col">
                    {/* Expandable text area for work text */}
                    {expanded && (
                        <div className="p-4 border-b border-white/5 bg-background/5 rounded-t-[1.75rem] mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <label className="text-xs font-medium tracking-wide text-muted-foreground flex items-center gap-2">
                                    <Plus className="h-3.5 w-3.5" /> Attach work text for audit
                                </label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                                    onClick={() => setExpanded(false)}
                                >
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Collapse
                                </Button>
                            </div>
                            <Textarea
                                placeholder="Paste code, document text, or process description here..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={4}
                                disabled={loading}
                                className="resize-none border-0 bg-black/20 focus-visible:ring-1 focus-visible:ring-white/10 rounded-2xl text-sm placeholder:text-muted-foreground/50"
                            />
                        </div>
                    )}

                    {/* Main input row */}
                    <div className="flex items-end gap-2 px-2">
                        {!expanded && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-[46px] w-[46px] shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-colors mb-0.5"
                                onClick={() => setExpanded(true)}
                                title="Attach work text"
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        )}
                        <Textarea
                            ref={textareaRef}
                            placeholder="Ask policy-guard"
                            value={query}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            rows={1}
                            className="flex-1 min-h-[46px] max-h-[160px] py-3.5 resize-none border-0 shadow-none focus-visible:ring-0 !bg-transparent text-[15px] placeholder:text-muted-foreground/70"
                        />
                        <Button
                            type="submit"
                            disabled={loading || !query.trim()}
                            size="icon"
                            variant="ghost"
                            className="h-[46px] w-[46px] shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all mb-0.5 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
