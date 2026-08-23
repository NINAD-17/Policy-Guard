import { Inngest } from "inngest";

// Inngest client to send and receive events
export const inngest = new Inngest({
    id: "policy-guard",
    isDev: process.env.NODE_ENV === "development",
});
