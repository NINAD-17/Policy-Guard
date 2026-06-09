/**
 * Seed Script — populates the database with 16 employees across 4 departments.
 *
 * Run: `npx tsx --env-file=.env.local scripts/seed.ts`
 */

import { auth } from "../lib/auth";
import { clientPromise } from "../lib/db";
import { createUserProfile } from "../db/users";

const SEED_PASSWORD = process.env.SEED_PASSWORD || "password123";

interface SeedEmployee {
    name: string;
    email: string;
    role: "admin" | "employee" | "manager";
    department: string;
    escalationManagerEmail?: string;
}

const employees: SeedEmployee[] = [
    // ── Managers ──────────────────────────────────────────────────────────────
    {
        name: "Sneha Deshmukh",
        email: "sneha.deshmukh@policypulse.dev",
        role: "manager",
        department: "Engineering",
    },
    {
        name: "Meera Rao",
        email: "meera.rao@policypulse.dev",
        role: "manager",
        department: "QA",
    },
    {
        name: "Kavita Sharma",
        email: "kavita.sharma@policypulse.dev",
        role: "manager",
        department: "HR",
    },
    {
        name: "Pooja Bhatia",
        email: "pooja.bhatia@policypulse.dev",
        role: "manager",
        department: "Data & Analytics",
    },

    // ── Engineering Employees ──────────────────────────────────────────────────
    {
        name: "Aarav Mehta",
        email: "aarav.mehta@policypulse.dev",
        role: "employee",
        department: "Engineering",
        escalationManagerEmail: "sneha.deshmukh@policypulse.dev",
    },
    {
        name: "Priya Nair",
        email: "priya.nair@policypulse.dev",
        role: "employee",
        department: "Engineering",
        escalationManagerEmail: "sneha.deshmukh@policypulse.dev",
    },
    {
        name: "Rohan Kulkarni",
        email: "rohan.kulkarni@policypulse.dev",
        role: "employee",
        department: "Engineering",
        escalationManagerEmail: "sneha.deshmukh@policypulse.dev",
    },

    // ── QA Employees ──────────────────────────────────────────────────────────
    {
        name: "Vikram Joshi",
        email: "vikram.joshi@policypulse.dev",
        role: "employee",
        department: "QA",
        escalationManagerEmail: "meera.rao@policypulse.dev",
    },
    {
        name: "Ananya Iyer",
        email: "ananya.iyer@policypulse.dev",
        role: "employee",
        department: "QA",
        escalationManagerEmail: "meera.rao@policypulse.dev",
    },
    {
        name: "Karan Patil",
        email: "karan.patil@policypulse.dev",
        role: "employee",
        department: "QA",
        escalationManagerEmail: "meera.rao@policypulse.dev",
    },

    // ── HR Employees ──────────────────────────────────────────────────────────
    {
        name: "Deepak Verma",
        email: "deepak.verma@policypulse.dev",
        role: "employee",
        department: "HR",
        escalationManagerEmail: "kavita.sharma@policypulse.dev",
    },
    {
        name: "Rajesh Gupta",
        email: "rajesh.gupta@policypulse.dev",
        role: "employee",
        department: "HR",
        escalationManagerEmail: "kavita.sharma@policypulse.dev",
    },

    // ── Data & Analytics Employees ────────────────────────────────────────────
    {
        name: "Ishaan Reddy",
        email: "ishaan.reddy@policypulse.dev",
        role: "employee",
        department: "Data & Analytics",
        escalationManagerEmail: "pooja.bhatia@policypulse.dev",
    },
    {
        name: "Nisha Agarwal",
        email: "nisha.agarwal@policypulse.dev",
        role: "employee",
        department: "Data & Analytics",
        escalationManagerEmail: "pooja.bhatia@policypulse.dev",
    },
    {
        name: "Amit Thakur",
        email: "amit.thakur@policypulse.dev",
        role: "employee",
        department: "Data & Analytics",
        escalationManagerEmail: "pooja.bhatia@policypulse.dev",
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    {
        name: "Admin User",
        email: "admin@policypulse.dev",
        role: "admin",
        department: "Engineering",
    },

    // ── Guest ─────────────────────────────────────────────────────────────────
    {
        name: "Guest User",
        email: "guest@policypulse.dev",
        role: "employee",
        department: "Engineering",
        escalationManagerEmail: "sneha.deshmukh@policypulse.dev",
    },
];

async function seed() {
    console.log("🌱 Starting seed...\n");

    let created = 0;
    let skipped = 0;

    // Track created user IDs for linking escalation managers
    const emailToUserId = new Map<string, string>();

    // Pass 1: Create all users via Better Auth
    for (const emp of employees) {
        try {
            const response = await auth.api.signUpEmail({
                body: {
                    name: emp.name,
                    email: emp.email,
                    password: SEED_PASSWORD,
                },
                asResponse: false
            });

            // If signup succeeded, store the returned user ID
            if (response && response.user && response.user.id) {
                emailToUserId.set(emp.email, response.user.id);
            }
            console.log(`  ✅ ${emp.name} (User Account Created)`);
            created++;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            if (message.includes("already") || message.includes("exists")) {
                console.log(`  ⏭️  ${emp.name} — already exists`);
                skipped++;
            } else {
                console.error(`  ❌ ${emp.name} — ${message}`);
            }
        }
    }

    console.log("\n🔗 Assigning User Profiles...\n");

    // Pass 2: Create User Profiles with Manager References
    for (const emp of employees) {
        const userId = emailToUserId.get(emp.email);
        if (!userId) continue; // Skip if user creation failed or existed beforehand (if existing, we'd need to fetch them. For a clean seed, we assume drop DB first)

        let escalationManagerId: string | undefined = undefined;
        if (emp.escalationManagerEmail) {
            escalationManagerId = emailToUserId.get(emp.escalationManagerEmail);
        }

        try {
            await createUserProfile({
                userId,
                role: emp.role,
                department: emp.department,
                escalationManagerId,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`  ✅ Profile linked: ${emp.name} (${emp.role})`);
        } catch (error) {
             console.error(`  ❌ Profile failed for ${emp.name}:`, error);
        }
    }

    console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}`);
    console.log(`\n📋 Credentials (password: ${SEED_PASSWORD})`);
    console.log(`   Admin:   admin@policypulse.dev`);
    console.log(`   Manager: sneha.deshmukh@policypulse.dev`);
    console.log(`   Employee: aarav.mehta@policypulse.dev\n`);

    const client = await clientPromise;
    await client.close();
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});

