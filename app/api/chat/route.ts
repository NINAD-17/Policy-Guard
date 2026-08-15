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

        // Send event to Inngest to trigger the compliance audit pipeline
        await inngest.send({
            name: "audit/query.submitted",
            data: {
                employeeId: session.user.id,
                employeeName: session.user.name,
                department: profile.department,
                role: profile.role,
                query: parsed.data.query,
                text: parsed.data.text,
                sessionId: session.session.id,
                isGuest: session.user.email === "guest@policypulse.dev",
            },
        });

        return NextResponse.json({
            message: "Audit query submitted, processing in background",
        });
    } catch (error) {
        if (error instanceof Response) return error;
        console.error("Chat error:", error);
        return NextResponse.json(
            { error: "Failed to submit query" },
            { status: 500 }
        );
    }
}
