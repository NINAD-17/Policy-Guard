import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { chatInputSchema } from "@/lib/types";
import { inngest } from "@/inngest/client";
import { getUserProfile } from "@/db/users";

// POST /api/chat — submit a compliance audit query
// Triggers the Inngest compliance-audit function
export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();

        const profile = await getUserProfile(session.user.id);
        if (!profile) {
            return NextResponse.json({ error: "User profile not found" }, { status: 404 });
        }

        const body = await request.json();
        const parsed = chatInputSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten() },
                { status: 400 }
            );
        }

        // Sanitize and cap input lengths to prevent token exhaustion
        const query = parsed.data.query.trim().slice(0, 500);
        const text = (parsed.data.text || "").trim().slice(0, 10000);

        // Send event to Inngest to trigger the compliance audit pipeline
        await inngest.send({
            name: "audit/query.submitted",
            data: {
                employeeId: session.user.id,
                employeeName: session.user.name,
                department: profile.department,
                role: profile.role,
                query,
                text,
                sessionId: session.session.id,
                isGuest: session.user.email === "guest@policypulse.dev",
            },
        });

        return NextResponse.json({
            message: "Audit query submitted, processing in background",
        });
    } catch (error: unknown) {
        if (error instanceof Response) return error;
        console.error("Chat error:", error);
        const errMsg = error instanceof Error ? error.message : "Failed to submit query";
        const isDev = process.env.NODE_ENV === "development";
        const errorDetail =
            isDev && (errMsg.includes("401") || errMsg.includes("Event key") || errMsg.includes("ECONNREFUSED"))
                ? "Inngest Dev Server is not running. Please start it with: npx inngest-cli@latest dev -u http://localhost:3000/api/inngest"
                : "Failed to submit query. Please check Inngest connection.";
        return NextResponse.json(
            { error: errorDetail },
            { status: 500 }
        );
    }
}
