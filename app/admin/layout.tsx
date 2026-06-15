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
        window.location.href = "/";
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        <h1 className="text-lg font-semibold">
                            PolicyGuard{" "}
                            <span className="text-muted-foreground font-normal">
                                Admin
                            </span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            {session?.user?.name || session?.user?.email}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        </div>
    );
}
