import { NextRequest } from "next/server";

interface RateLimitRecord {
    timestamps: number[];
}

// In-memory sliding window cache
const rateLimitCache = new Map<string, RateLimitRecord>();

// Clean up stale keys every 10 minutes to prevent memory leak
const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    const expiryCutoff = now - windowMs;
    for (const [key, record] of rateLimitCache.entries()) {
        const validTimestamps = record.timestamps.filter((t) => t > expiryCutoff);
        if (validTimestamps.length === 0) {
            rateLimitCache.delete(key);
        } else {
            rateLimitCache.set(key, { timestamps: validTimestamps });
        }
    }
}

/**
 * Extracts client IP from incoming NextRequest headers
 */
export function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
    
    const cfIp = request.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();

    return "127.0.0.1";
}

/**
 * Checks sliding-window rate limit for a specific key
 * @param key Unique key (e.g. `guest:ip:1.2.3.4` or `guest:session:xyz`)
 * @param limit Max allowed requests within the window (default: 10)
 * @param windowMs Time window in milliseconds (default: 1 hour)
 */
export function checkRateLimit(
    key: string,
    limit: number = 10,
    windowMs: number = 60 * 60 * 1000
): { allowed: boolean; remaining: number; resetMinutes: number } {
    cleanupStaleEntries(windowMs);

    const now = Date.now();
    const expiryCutoff = now - windowMs;

    const record = rateLimitCache.get(key) || { timestamps: [] };
    const validTimestamps = record.timestamps.filter((t) => t > expiryCutoff);

    if (validTimestamps.length >= limit) {
        const oldest = validTimestamps[0];
        const resetMinutes = Math.max(1, Math.ceil((oldest + windowMs - now) / 60000));
        return {
            allowed: false,
            remaining: 0,
            resetMinutes,
        };
    }

    validTimestamps.push(now);
    rateLimitCache.set(key, { timestamps: validTimestamps });

    return {
        allowed: true,
        remaining: limit - validTimestamps.length,
        resetMinutes: Math.ceil(windowMs / 60000),
    };
}
