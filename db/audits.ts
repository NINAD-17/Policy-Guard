import { clientPromise } from "@/lib/db";
import { COLLECTIONS, AuditLog } from "@/lib/types";
import { ObjectId } from "mongodb";

export async function getAuditLogs(filter: Record<string, unknown> = {}, limit: number = 20, offset: number = 0) {
    const client = await clientPromise;
    const db = client.db();

    const [logs, total] = await Promise.all([
        db.collection(COLLECTIONS.AUDIT_LOGS)
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .toArray(),
        db.collection(COLLECTIONS.AUDIT_LOGS).countDocuments(filter),
    ]);

    return { logs: logs as unknown as AuditLog[], total, limit, offset };
}

export async function createAuditLog(log: Omit<AuditLog, "_id">): Promise<string> {
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection(COLLECTIONS.AUDIT_LOGS).insertOne(log);
    return result.insertedId.toString();
}

export async function getAuditLog(id: string | ObjectId): Promise<AuditLog | null> {
    const client = await clientPromise;
    const db = client.db();
    const logId = typeof id === "string" ? new ObjectId(id) : id;
    const log = await db.collection(COLLECTIONS.AUDIT_LOGS).findOne({ _id: logId });
    return log as unknown as AuditLog | null;
}
