import { ObjectId } from "mongodb";
import { z } from "zod";

// ── Employee ────────────────────────────────────────────────────────────────
// Stored in better-auth's "user" collection.
// better-auth manages: id, name, email, emailVerified, image, createdAt, updatedAt
// Custom fields added via additionalFields: role, department, level, jobTitle

export interface Employee {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role: "admin" | "employee";
    department: string;
    level: "L1" | "L2" | "L3" | "specialist";
    jobTitle: string;
    createdAt: Date;
    updatedAt: Date;
}

export const DEPARTMENTS = [
    "Engineering",
    "QA",
    "HR",
    "Data & Analytics",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const LEVELS = ["L1", "L2", "L3", "specialist"] as const; // 'as const' - array is 'Read Only' and values will never change
export type Level = (typeof LEVELS)[number];

// ── SOP Document ────────────────────────────────────────────────────────────

export interface SOPDocument {
    _id?: ObjectId;
    title: string;
    description: string;
    s3Key: string;
    scope: "global" | "department-specific";
    departments: string[];
    status: "processing" | "active" | "archived";
    uploadedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export const sopDocumentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    scope: z.enum(["global", "department-specific"]),
    departments: z.array(z.string()).default([]),
});

// ── SOP Chunk (for vector search) ───────────────────────────────────────────

export interface SOPChunk {
    _id?: ObjectId;
    documentId: ObjectId;
    content: string;
    chunkIndex: number;
    embedding: number[];
    scope: "global" | "department-specific"; // denormalized from parent doc
    departments: string[];
}

// ── Audit Log ───────────────────────────────────────────────────────────────
// Each entry = one query + AI response pair, shown as a scrollable chat

// A single finding from the audit (e.g. "Limited Scope of Review")
export interface AuditFinding {
    title: string;
    description: string;
    status: "compliant" | "non_compliant";
    sopReferences: number[]; // indices into sourcesUsed array
}

// A source document referenced in the audit report
export interface AuditSource {
    index: number;           // 1-based reference number used in findings
    documentTitle: string;
    documentId: string;      // MongoDB ObjectId string — used to fetch presigned URL
}

// The structured audit report (new format)
export interface AuditReportStructured {
    summary: string;
    findings: AuditFinding[];
    recommendations: string[];
}

export interface AuditLog {
    _id?: ObjectId;
    employeeId: string;
    employeeName: string;
    department: string;
    userQuery: string;
    userText: string;
    // Union type: old logs are plain string (markdown), new logs are structured JSON
    auditReport: string | AuditReportStructured;
    confidenceScore: number;
    // Union type: old logs are string[], new logs are AuditSource[]
    sourcesUsed: string[] | AuditSource[];
    status: "compliant" | "non_compliant" | "needs_review";
    tags: string[];
    escalated: boolean;
    escalatedToName?: string;
    escalatedToEmail?: string;
    escalationMessage?: string;
    createdAt: Date;
}

export const chatInputSchema = z.object({
    query: z.string().min(1, "Query is required"),
    text: z.string().optional().default(""),
});

// ── Collection Names ────────────────────────────────────────────────────────

export const COLLECTIONS = {
    SOP_DOCUMENTS: "sop_documents",
    SOP_CHUNKS: "sop_chunks",
    AUDIT_LOGS: "audit_logs",
} as const;
