import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// LangChain defaults to GOOGLE_API_KEY, but our env uses GOOGLE_GENERATIVE_AI_API_KEY
let embeddings: GoogleGenerativeAIEmbeddings | null = null;

function getEmbeddings(): GoogleGenerativeAIEmbeddings {
    if (embeddings) return embeddings;

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("Google GenerativeAI API key is not defined in environment variables (GOOGLE_GENERATIVE_AI_API_KEY)");
    }

    embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey,
        model: "gemini-embedding-001",
    });

    return embeddings;
}

/** Generate embedding vector for a single text string */
export async function generateEmbedding(text: string): Promise<number[]> {
    return getEmbeddings().embedQuery(text);
}

/** Generate embedding vectors for multiple texts in batch */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    return getEmbeddings().embedDocuments(texts);
}
