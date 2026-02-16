import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        // Provides type safety for our custom user fields (role, department, etc.)
        // Without this, TypeScript won't recognize those fields on session.user
        inferAdditionalFields({
            user: {
                role: { type: "string" },
                department: { type: "string" },
                level: { type: "string" },
                jobTitle: { type: "string" },
            },
        }),
    ],
});

export const { signIn, signOut, useSession } = authClient;
