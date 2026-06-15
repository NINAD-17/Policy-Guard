"use client";

import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogOut } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();

    const handleLogout = async () => {
        await signOut();
        window.location.href = "/?logout=true";
    };

    return (
        <div className="h-dvh w-screen flex flex-col overflow-hidden bg-background relative z-0">
            {/* Background ambient glows - match dashboard aesthetics */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[130px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />

            {/* Header */}
            <header className="border-b border-white/10 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        <h1 className="text-lg font-semibold tracking-tight">
                            PolicyGuard{" "}
                            <span className="text-muted-foreground font-normal text-sm ml-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                Admin
                            </span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-muted-foreground">
                            {session?.user?.name || session?.user?.email}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="h-9 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto px-6 py-8 relative">
                {children}
            </main>
        </div>
    );
}
