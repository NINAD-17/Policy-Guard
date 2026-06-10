import { ObjectId } from "mongodb";
import { z } from "zod";

// ── User Profile ────────────────────────────────────────────────────────────
// Stored in custom "user_profiles" collection

export interface UserProfile {
    _id?: ObjectId;
    userId: string; // references Better Auth's users.id
    role: "admin" | "employee" | "manager";
    department: string;
    escalationManagerId?: string; // userId of their manager
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

// ── SOP Document ────────────────────────────────────────────────────────────

export interface SOPDocument {
    _id?: ObjectId;
    title: string;
    description: string;
    s3Key: string;
    thumbnailUrl?: string; // S3 URL for the first page thumbnail
    scope: "global" | "department-specific";
    departments: string[];
    status: "processing" | "active" | "archived" | "failed";
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
    pageNumber?: number; // Crucial for PDF citation proof
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
    pageNumber?: number;     // The exact page number referenced
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
    escalatedToId?: string;
    escalatedToName?: string;
    escalatedToEmail?: string;
    escalationMessage?: string;
    sessionId?: string;
    isGuest?: boolean;
    createdAt: Date;
}

export const chatInputSchema = z.object({
    query: z.string().min(1, "Query is required"),
    text: z.string().optional().default(""),
});

// ── Collection Names ────────────────────────────────────────────────────────

export const COLLECTIONS = {
    USER_PROFILES: "user_profiles",
    SOP_DOCUMENTS: "sop_documents",
    SOP_CHUNKS: "sop_chunks",
    AUDIT_LOGS: "audit_logs",
} as const;

