import type { TokenUsage } from "./types";

/**
 * Calculates estimated tokens and USD cost based on query, text, sources, and response.
 * Uses Gemini 2.5 Flash developer rates ($0.075 / 1M prompt, $0.30 / 1M completion).
 */
export function calculateEstimatedTokens(params: {
    query: string;
    text?: string;
    sourcesCount?: number;
    responseLength?: number;
    intent?: string;
}): TokenUsage {
    const { query, text = "", sourcesCount = 0, responseLength = 500, intent = "compliance_audit" } = params;

    // Estimate ~4 characters per token
    const queryTokens = Math.ceil(query.length / 4);
    const textTokens = Math.ceil(text.length / 4);

    // System prompt & agent instructions overhead (~1,200 tokens across multi-agent chain)
    const baseSystemTokens = intent === "chitchat" ? 500 : 1500;

    // Retrieved SOP chunks context overhead (~300 tokens per chunk)
    const contextTokens = sourcesCount * 300;

    const promptTokens = baseSystemTokens + queryTokens + textTokens + contextTokens;
    const completionTokens = Math.ceil(responseLength / 4);
    const totalTokens = promptTokens + completionTokens;

    // Gemini 2.5 Flash Pricing ($0.075 / 1M prompt, $0.30 / 1M completion)
    const promptCost = (promptTokens / 1_000_000) * 0.075;
    const completionCost = (completionTokens / 1_000_000) * 0.30;
    const estimatedCostUSD = Number((promptCost + completionCost).toFixed(6));

    return {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUSD,
    };
}
