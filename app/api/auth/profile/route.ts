import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getUserProfile } from "@/db/users";

export async function GET(request: NextRequest) {
    try {
        const session = await requireSession();
        const profile = await getUserProfile(session.user.id);
        
        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }
        
        return NextResponse.json({
            department: profile.department,
            role: profile.role,
        });
    } catch (error) {
        if (error instanceof Response) return error;
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
