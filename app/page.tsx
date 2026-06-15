"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, Sparkles, X, Loader2 } from "lucide-react";
import { useSession, signIn } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function HomeContent() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showModal, setShowModal] = useState(false);

    // Auto-open login modal when redirected from proxy with ?login=true
    useEffect(() => {
        if (searchParams.get("login") === "true" && !session) {
            setShowModal(true);
        }
    }, [searchParams, session]);

    // Handle toast alerts from query parameters
    useEffect(() => {
        const logout = searchParams.get("logout");
        const login = searchParams.get("login");
        const callbackUrl = searchParams.get("callbackUrl");

        if (logout === "true") {
            toast.success("Logged out successfully!");
            // Clean url query parameters
            const url = new URL(window.location.href);
            url.searchParams.delete("logout");
            window.history.replaceState({}, "", url.pathname + url.search);
        } else if (login === "true" && callbackUrl && !session) {
            toast.error("Session expired. Please sign in again.");
            // Clean login parameters so the error toast doesn't re-trigger on subsequent updates
            const url = new URL(window.location.href);
            url.searchParams.delete("login");
            window.history.replaceState({}, "", url.pathname + url.search);
        }
    }, [searchParams, session]);
    
    // Login form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await signIn.email({ email, password });
            if (result.error) {
                setError(result.error.message || "Invalid credentials");
                setLoading(false);
                return;
            }
            toast.success("Signed in successfully!");
            router.push(searchParams.get("callbackUrl") || "/dashboard");
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setError("");
        setLoading(true);
        try {
            const result = await signIn.email({
                email: "guest@policypulse.dev",
                password: "password123",
            });
            if (result.error) {
                setError("Guest login failed.");
                setLoading(false);
                return;
            }
            toast.success("Logged in as Guest!");
            router.push(searchParams.get("callbackUrl") || "/dashboard");
        } catch {
            setError("Something went wrong with guest login.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
            {/* Background glowing effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="z-10 text-center px-4 max-w-3xl mx-auto flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium tracking-wide">Enterprise Prototype</span>
                </div>

                <div className="flex items-center justify-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    PolicyGuard
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                    Agentic RAG for Enterprise Compliance. Auditing employee workflows against dynamic Standard Operating Procedures with real-time vector search.
                </p>

                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500">
                    {isPending ? (
                        <div className="h-12 w-40 rounded-full bg-primary/20 animate-pulse" />
                    ) : session ? (
                        <Link
                            href="/dashboard"
                            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]"
                        >
                            <span>Go to Dashboard</span>
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    ) : (
                        <button
                            onClick={() => setShowModal(true)}
                            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]"
                        >
                            <span>Enter Prototype</span>
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-sm text-muted-foreground/60">
                Created for internal enterprise testing
            </div>

            {/* Login Modal Overlay */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-3xl px-4 animate-in fade-in duration-300">
                    <div className="glass-panel bg-background/10 w-full max-w-md rounded-3xl p-6 md:p-8 relative shadow-[0_0_100px_rgba(var(--primary),0.2)] border-white/20 animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold tracking-tight mb-2">Welcome Back</h2>
                            <p className="text-sm text-muted-foreground">Sign in to access the PolicyGuard prototype</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1.5 text-left">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Email</label>
                                <Input
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="bg-background/50 border-white/10 h-12 rounded-xl px-4"
                                />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="bg-background/50 border-white/10 h-12 rounded-xl px-4"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                                    {error}
                                </p>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium mt-2"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in"}
                            </Button>
                            
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-3 text-muted-foreground font-semibold rounded-full border border-white/5">
                                        Or
                                    </span>
                                </div>
                            </div>
                            
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 font-medium"
                                onClick={handleGuestLogin}
                                disabled={loading}
                            >
                                Continue as Guest
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Home() {
    return (
        <Suspense>
            <HomeContent />
        </Suspense>
    );
}
