"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, ChevronUp, ChevronDown, Paperclip, Plus, Mic, Sparkles } from "lucide-react";

interface ChatInputProps {
    onSubmit?: (query: string, text: string) => void;
    loading?: boolean;
    disabled?: boolean;
    showSuggestions?: boolean;
    placeholder?: string;
}

const SUGGESTED_QUERIES = [
    "Explain the process of engineering code review and quality control process",
    "Does my code review follow SOP if I approved a PR in 5 mins without running tests?",
    "An API secret was pushed to GitHub and repo deleted but key not rotated. Is this okay?",
    "I spent 20 mins reviewing PR logic, verified tests passed, no secrets. Is this compliant?",
];

export function ChatInput({
    onSubmit,
    loading = false,
    disabled = false,
    showSuggestions = true,
    placeholder = "Ask policy-guard",
}: ChatInputProps) {
    const [query, setQuery] = useState("");
    const [text, setText] = useState("");
    const [expanded, setExpanded] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (disabled || !query.trim() || !onSubmit) return;
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
        if (disabled) return;
        setQuery(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    };

    return (
        <div className="fixed bottom-4 sm:bottom-6 left-0 lg:left-72 right-0 mx-auto w-full max-w-3xl px-4 z-20 space-y-2">
            {/* Suggested Query Chips */}
            {!expanded && (
                <div className={`flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar px-1 transition-all duration-300 ${showSuggestions && !disabled ? "opacity-100 max-h-12 translate-y-0" : "opacity-0 max-h-0 -translate-y-2 pointer-events-none overflow-hidden"}`}>
                    <div className="flex items-center gap-1.5 text-xs text-primary font-semibold shrink-0 bg-primary/15 px-3 py-1.5 rounded-full border border-primary/25 shadow-sm">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Try asking</span>
                    </div>
                    {SUGGESTED_QUERIES.map((q, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => onSubmit && onSubmit(q, "")}
                            disabled={loading || disabled}
                            className="shrink-0 glass-panel bg-card/85 hover:bg-primary/20 backdrop-blur-xl border border-white/15 hover:border-primary/40 text-foreground font-medium text-xs px-3.5 py-1.5 rounded-full transition-all duration-300 shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <span>{q}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className={`glass-panel bg-card/80 backdrop-blur-xl border border-white/20 focus-within:border-primary/40 shadow-[0_12px_40px_-5px_rgba(0,0,0,0.75),0_0_20px_rgba(var(--primary),0.15)] focus-within:shadow-[0_16px_48px_-5px_rgba(0,0,0,0.85),0_0_30px_rgba(var(--primary),0.3)] rounded-[2rem] p-1.5 transition-all duration-300 ${disabled ? "opacity-75" : ""}`}>
                <form onSubmit={handleSubmit} className="flex flex-col">
                    {/* Expandable text area for work text */}
                    {expanded && !disabled && (
                        <div className="p-4 border-b border-white/10 bg-background/5 rounded-t-[1.75rem] mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <label className="text-xs font-medium tracking-wide text-muted-foreground flex items-center gap-2">
                                    <Plus className="h-3.5 w-3.5 text-primary" /> Attach work text for audit
                                </label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
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
                                disabled={loading || disabled}
                                className="resize-none border-0 bg-black/20 focus-visible:ring-1 focus-visible:ring-white/10 rounded-2xl text-sm placeholder:text-muted-foreground/50"
                            />
                        </div>
                    )}

                    {/* Main input row */}
                    <div className="flex items-end gap-2 px-2">
                        {!expanded && !disabled && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-[46px] w-[46px] shrink-0 text-muted-foreground hover:text-primary hover:bg-white/5 rounded-full transition-colors mb-0.5 cursor-pointer"
                                onClick={() => setExpanded(true)}
                                title="Attach work text"
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        )}
                        <Textarea
                            ref={textareaRef}
                            placeholder={placeholder}
                            value={query}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            disabled={loading || disabled}
                            rows={1}
                            className={`flex-1 min-h-[46px] max-h-[160px] py-3.5 resize-none border-0 shadow-none focus-visible:ring-0 !bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/70 ${disabled ? "cursor-not-allowed text-muted-foreground" : ""}`}
                        />
                        <Button
                            type="submit"
                            disabled={loading || disabled || !query.trim()}
                            size="icon"
                            variant="ghost"
                            className="h-[46px] w-[46px] shrink-0 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 shadow-[0_0_12px_rgba(var(--primary),0.25)] hover:scale-105 active:scale-95 transition-all mb-0.5 cursor-pointer disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-primary/20 disabled:hover:text-primary"
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
