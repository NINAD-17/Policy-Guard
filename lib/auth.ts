import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "./db";

export const auth = betterAuth({
    database: mongodbAdapter(client.db(), { client }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "employee",
                input: true,
            },
            department: {
                type: "string",
                required: false,
                defaultValue: "",
                input: true,
            },
            level: {
                type: "string",
                required: false,
                defaultValue: "L1",
                input: true,
            },
            jobTitle: {
                type: "string",
                required: false,
                defaultValue: "",
                input: true,
            },
        },
    },
});
