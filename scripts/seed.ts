/**
 * Seed Script — populates the database with 16 employees across 4 departments.
 *
 * Run: `npx tsx --env-file=.env.local scripts/seed.ts` (The --env-file flag tells Node.js to read that file and load the variables before running any code.)
 *
 * Uses better-auth's internal API to create users with properly hashed passwords.
 * Default password for all users: "password123"
 */

import { auth } from "../lib/auth";
import { clientPromise } from "../lib/db";

const SEED_PASSWORD = "password123";

interface SeedEmployee {
    name: string;
    email: string;
    role: "admin" | "employee";
    department: string;
    level: "L1" | "L2" | "L3" | "specialist";
    jobTitle: string;
}

const employees: SeedEmployee[] = [
    // ── Engineering ───────────────────────────────────────────────────────────
    {
        name: "Aarav Mehta",
        email: "aarav.mehta@policypulse.dev",
        role: "employee",
        department: "Engineering",
        level: "L1",
        jobTitle: "Junior Developer",
    },
    {
        name: "Priya Nair",
        email: "priya.nair@policypulse.dev",
        role: "employee",
        department: "Engineering",
        level: "L1",
        jobTitle: "Junior Developer",
    },
    {
        name: "Rohan Kulkarni",
        email: "rohan.kulkarni@policypulse.dev",
        role: "employee",
        department: "Engineering",
        level: "L2",
        jobTitle: "Senior Developer",
    },
    {
        name: "Sneha Deshmukh",
        email: "sneha.deshmukh@policypulse.dev",
        role: "employee",
        department: "Engineering",
        level: "L3",
        jobTitle: "Engineering Manager",
    },

    // ── QA ────────────────────────────────────────────────────────────────────
    {
        name: "Vikram Joshi",
        email: "vikram.joshi@policypulse.dev",
        role: "employee",
        department: "QA",
        level: "L1",
        jobTitle: "Junior QA Engineer",
    },
    {
        name: "Ananya Iyer",
        email: "ananya.iyer@policypulse.dev",
        role: "employee",
        department: "QA",
        level: "L1",
        jobTitle: "Junior QA Engineer",
    },
    {
        name: "Karan Patil",
        email: "karan.patil@policypulse.dev",
        role: "employee",
        department: "QA",
        level: "L2",
        jobTitle: "Senior QA Lead",
    },
    {
        name: "Meera Rao",
        email: "meera.rao@policypulse.dev",
        role: "employee",
        department: "QA",
        level: "L3",
        jobTitle: "QA Architect",
    },

    // ── HR ────────────────────────────────────────────────────────────────────
    {
        name: "Deepak Verma",
        email: "deepak.verma@policypulse.dev",
        role: "employee",
        department: "HR",
        level: "L1",
        jobTitle: "HR Associate",
    },
    {
        name: "Kavita Sharma",
        email: "kavita.sharma@policypulse.dev",
        role: "employee",
        department: "HR",
        level: "L2",
        jobTitle: "Senior HR Business Partner",
    },
    {
        name: "Rajesh Gupta",
        email: "rajesh.gupta@policypulse.dev",
        role: "employee",
        department: "HR",
        level: "specialist",
        jobTitle: "Compliance Officer",
    },

    // ── Data & Analytics ──────────────────────────────────────────────────────
    {
        name: "Ishaan Reddy",
        email: "ishaan.reddy@policypulse.dev",
        role: "employee",
        department: "Data & Analytics",
        level: "L1",
        jobTitle: "Junior Data Analyst",
    },
    {
        name: "Nisha Agarwal",
        email: "nisha.agarwal@policypulse.dev",
        role: "employee",
        department: "Data & Analytics",
        level: "L1",
        jobTitle: "Junior Data Engineer",
    },
    {
        name: "Amit Thakur",
        email: "amit.thakur@policypulse.dev",
        role: "employee",
        department: "Data & Analytics",
        level: "L2",
        jobTitle: "Senior Data Scientist",
    },
    {
        name: "Pooja Bhatia",
        email: "pooja.bhatia@policypulse.dev",
        role: "employee",
        department: "Data & Analytics",
        level: "L3",
        jobTitle: "Head of Analytics",
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    {
        name: "Admin User",
        email: "admin@policypulse.dev",
        role: "admin",
        department: "Engineering",
        level: "L3",
        jobTitle: "Platform Administrator",
    },
];

async function seed() {
    console.log("🌱 Starting seed...\n");

    let created = 0;
    let skipped = 0;

    for (const emp of employees) {
        try {
            await auth.api.signUpEmail({
                body: {
                    name: emp.name,
                    email: emp.email,
                    password: SEED_PASSWORD,
                    role: emp.role,
                    department: emp.department,
                    level: emp.level,
                    jobTitle: emp.jobTitle,
                },
            });
            console.log(`  ✅ ${emp.name} (${emp.department} / ${emp.level})`);
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

    console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}`);
    console.log(`\n📋 Credentials (password: ${SEED_PASSWORD})`);
    console.log(`   Admin:   admin@policypulse.dev`);
    console.log(`   Example: aarav.mehta@policypulse.dev\n`);

    const client = await clientPromise;
    await client.close();
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
