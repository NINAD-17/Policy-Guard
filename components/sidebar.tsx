"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    ShieldCheck,
    LogOut,
    MessageSquare,
    Library,
    PlayCircle,
    Menu,
    X,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [profile, setProfile] = useState<{ department: string; role: string } | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/auth/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                }
            } catch (e) {
                console.error("Failed to fetch profile");
            }
        }
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await signOut();
        window.location.href = "/?logout=true";
    };

    const navItems = [
        { name: "SOP Chat", href: "/dashboard", icon: MessageSquare },
        { name: "Demo Chat", href: "/dashboard/demo", icon: PlayCircle },
        { name: "SOP Documents", href: "/dashboard/documents", icon: Library },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full glass-panel border-r border-white/10 relative z-20 w-72 rounded-none">
            {/* Header */}
            <div className="mt-16 lg:mt-0 p-6 flex items-center gap-3">
                <Link href="/" className="p-2 bg-primary/20 rounded-xl border border-primary/30 hover:bg-primary/30 transition-colors" title="Back to home">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </Link>
                <Link href="/" className="font-bold text-lg tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                    PolicyGuard
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                    Menu
                </div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                                isActive
                                    ? "glass-panel shadow-md text-foreground border-white/10"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Admin Controls — only visible for admin role */}
            {profile?.role === "admin" && (
                <div className="px-4 pb-2">
                    <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                            pathname.startsWith("/admin")
                                ? "glass-panel shadow-md text-primary border-primary/20 bg-primary/10"
                                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        )}
                    >
                        <Settings className="h-5 w-5" />
                        <span className="font-medium text-sm">Admin Controls</span>
                    </Link>
                </div>
            )}

            {/* Profile + Logout */}
            <div className="p-4 mt-auto">
                <div className="p-3 glass-panel rounded-2xl flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0 border border-white/10 bg-white/5">
                        <AvatarFallback className="bg-transparent text-foreground text-sm font-semibold">
                            {(session?.user?.name || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground/90">
                            {session?.user?.name || "Employee"}
                        </p>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/10 text-muted-foreground border-white/5">
                            {profile?.department || "—"}
                        </Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/20 rounded-full transition-colors"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden fixed top-4 left-4 z-50 h-12 w-12 glass-panel rounded-full text-foreground hover:text-primary transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block h-dvh shrink-0 relative z-10">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent" onClick={() => setMobileOpen(false)}>
                    <div className="absolute top-0 left-0 h-full w-72" onClick={(e) => e.stopPropagation()}>
                        <SidebarContent />
                    </div>
                </div>
            )}
        </>
    );
}

