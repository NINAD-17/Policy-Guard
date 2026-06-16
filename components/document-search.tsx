"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SearchResult {
    documentId: string;
    documentTitle: string;
    contentSnippet: string;
    score: number;
}

export function DocumentSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Debounce query
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 800);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        let ignore = false;
        const controller = new AbortController();

        async function fetchResults() {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/documents/search?q=${encodeURIComponent(debouncedQuery)}`, {
                    signal: controller.signal
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!ignore) {
                        setResults(data);
                    }
                } else if (!ignore) {
                    toast.error("Failed to search documents");
                }
            } catch (err: any) {
                if (err.name === "AbortError") {
                    console.log("Fetch aborted");
                } else if (!ignore) {
                    toast.error("Failed to search documents");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        fetchResults();

        return () => {
            ignore = true;
            controller.abort();
        };
    }, [debouncedQuery]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleViewPDF = async (docId: string) => {
        try {
            const res = await fetch(`/api/documents/${docId}/url`);
            if (!res.ok) throw new Error();
            const { url } = await res.json();
            window.open(url, "_blank");
            setIsOpen(false);
        } catch {
            toast.error("Failed to open document");
        }
    };

    return (
        <div className="absolute bottom-6 left-0 right-0 mx-auto w-full max-w-3xl px-4 z-30" ref={searchRef}>
            {/* Search Results Dropup */}
            {isOpen && (query.trim().length > 0) && (
                <div className="absolute bottom-full left-4 right-4 mb-3 glass-panel bg-card/90 backdrop-blur-xl border-white/20 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.7)] rounded-[1.5rem] p-2 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden max-h-[60vh] flex flex-col">
                    <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search Results</span>
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    </div>
                    
                    <div className="overflow-y-auto p-1 flex-1">
                        {!loading && results.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No relevant documents found.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {results.map((result) => (
                                    <button
                                        key={result.documentId}
                                        onClick={() => handleViewPDF(result.documentId)}
                                        className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors group flex items-start gap-3"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <FileText className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                                {result.documentTitle}
                                            </h4>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                {result.contentSnippet}
                                            </p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Search Input Bar */}
            <div className="glass-panel bg-card/75 border-white/20 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.7)] rounded-[2rem] p-1.5 transition-all duration-300 focus-within:shadow-[0_8px_40px_-12px_rgba(var(--primary),0.3)] focus-within:bg-card/85 focus-within:border-white/30 flex items-center gap-2 px-2">
                <Search className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                <input
                    type="text"
                    placeholder="Search documents by keywords or content..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="flex-1 h-[46px] bg-transparent border-0 focus:ring-0 text-[15px] placeholder:text-muted-foreground/70 outline-none"
                />
                {loading && (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2 shrink-0" />
                )}
            </div>
        </div>
    );
}
