import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
    throw new Error("Please add your MongoDB URI to .env.local");
}

const uri = process.env.MONGODB_URI;

declare global {
    // eslint-disable-next-line no-var
    var _mongoClient: MongoClient | undefined;
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Reuse existing client in development (survives hot reload)
const client: MongoClient = global._mongoClient || new MongoClient(uri);
const clientPromise: Promise<MongoClient> =
    global._mongoClientPromise || client.connect();

if (process.env.NODE_ENV === "development") {
    global._mongoClient = client;
    global._mongoClientPromise = clientPromise;
}

// `client` — raw MongoClient, auto-connects on first operation (used by better-auth)
// `clientPromise` — awaitable, ensures connection is established before use
export { client, clientPromise };
