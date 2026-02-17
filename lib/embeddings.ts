import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// LangChain defaults to GOOGLE_API_KEY, but our env uses GOOGLE_GENERATIVE_AI_API_KEY
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    modelName: "text-embedding-004",
});

/** Generate embedding vector for a single text string */
export async function generateEmbedding(text: string): Promise<number[]> {
    return embeddings.embedQuery(text);
}

/** Generate embedding vectors for multiple texts in batch */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    return embeddings.embedDocuments(texts);
}
