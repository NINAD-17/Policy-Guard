"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn.email({
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message || "Invalid credentials");
                setLoading(false);
                return;
            }

            // Fetch profile to get role from the custom user_profiles collection
            const profileRes = await fetch("/api/auth/profile");
            if (!profileRes.ok) {
                setError("Failed to load user profile. Please try again.");
                setLoading(false);
                return;
            }

            const profile = await profileRes.json();
            const role = profile.role;

            if (role === "admin") {
                router.push("/admin");
            } else {
                router.push("/dashboard");
            }
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
                setError("Guest login failed. Please ensure the database is seeded.");
                setLoading(false);
                return;
            }

            // Fetch profile for guest to route consistently
            const profileRes = await fetch("/api/auth/profile");
            if (!profileRes.ok) {
                setError("Failed to load guest profile.");
                setLoading(false);
                return;
            }

            const profile = await profileRes.json();
            const role = profile.role;

            if (role === "admin") {
                router.push("/admin");
            } else {
                router.push("/dashboard");
            }
        } catch {
            setError("Something went wrong with guest login.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                        <ShieldCheck className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            PolicyGuard
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Enterprise Compliance Audit Platform
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive text-center">
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </Button>
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-muted-foreground/20" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Or
                                </span>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleGuestLogin}
                            disabled={loading}
                        >
                            Continue as Guest
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
