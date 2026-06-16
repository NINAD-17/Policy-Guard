import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { vectorSearchSOPChunks } from "@/db/sops";
import { getUserProfile } from "@/db/users";
import { generateEmbedding } from "@/lib/embeddings";

export async function GET(request: Request) {
    try {
        const session = await requireSession();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.trim() === "") {
            return NextResponse.json([]);
        }

        const profile = await getUserProfile(session.user.id);
        const role = profile?.role || "employee";
        const department = profile?.department;

        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(query);
        console.debug("Query Embedding: ", queryEmbedding);

        // Perform vector search
        const chunks = await vectorSearchSOPChunks(queryEmbedding, role, department, 20);

        // Group by documentId and keep the most relevant chunk
        const docMap = new Map();
        for (const chunk of chunks) {
            const idStr = chunk.documentId.toString();
            if (!docMap.has(idStr)) {
                docMap.set(idStr, {
                    documentId: idStr,
                    documentTitle: chunk.documentTitle,
                    contentSnippet: chunk.content.substring(0, 150) + "...",
                    score: chunk.score,
                });
            }
        }

        // Return top 5 unique documents
        const results = Array.from(docMap.values()).slice(0, 5);

        return NextResponse.json(results);
    } catch (error) {
        if (error instanceof Response) return error;
        console.error("Search error:", error);
        return NextResponse.json(
            { error: "Failed to search documents" },
            { status: 500 }
        );
    }
}
