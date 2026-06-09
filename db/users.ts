import { clientPromise } from "@/lib/db";
import { COLLECTIONS, UserProfile } from "@/lib/types";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const client = await clientPromise;
    const db = client.db();
    const profile = await db.collection(COLLECTIONS.USER_PROFILES).findOne({ userId });
    return profile as unknown as UserProfile | null;
}

export async function getUserRole(userId: string): Promise<string | null> {
    const client = await clientPromise;
    const db = client.db();
    const profile = await db.collection(COLLECTIONS.USER_PROFILES).findOne(
        { userId },
        { projection: { role: 1, _id: 0 } }
    );
    return profile?.role as string | null;
}

export async function createUserProfile(profile: Omit<UserProfile, "_id">): Promise<void> {
    const client = await clientPromise;
    const db = client.db();
    await db.collection(COLLECTIONS.USER_PROFILES).insertOne(profile);
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const client = await clientPromise;
    const db = client.db();
    await db.collection(COLLECTIONS.USER_PROFILES).updateOne(
        { userId },
        { $set: updates }
    );
}
