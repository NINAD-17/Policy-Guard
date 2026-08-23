"use client";

import { useState } from "react";
import { AuditFeed } from "@/components/audit-feed";
import { ChatInput } from "@/components/chat-input";
import { ShieldCheck, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import type { AuditLogEntry } from "@/components/audit-card";

// Hardcoded demo data showcasing all agent intents
const DEMO_LOGS: AuditLogEntry[] = [
    {
        _id: "demo-chitchat",
        userQuery: "Hello PolicyGuard! How can you help me today?",
        userText: "",
        intent: "chitchat",
        confidenceScore: 1.0,
        status: "compliant",
        tags: ["chitchat"],
        createdAt: "2026-08-17T15:24:40.000Z",
        sourcesUsed: [],
        auditReport: {
            summary: "Hello! I'm PolicyGuard, your autonomous AI compliance assistant. You can ask me to search SOP documents, explain specific company policies in plain language, or submit descriptions of your work for automated compliance auditing.",
            findings: [],
            recommendations: [],
        },
    },
    {
        _id: "demo-sop-search",
        userQuery: "Find SOP documents related to data retention and remote access policy.",
        userText: "",
        intent: "sop_search",
        confidenceScore: 0.95,
        status: "compliant",
        tags: ["sop-search", "Data Retention", "Security"],
        createdAt: "2026-08-17T16:24:40.000Z",
        sourcesUsed: [
            {
                index: 1,
                documentTitle: "Data Retention & Archival SOP",
                documentId: "demo-doc-1",
                pageNumber: 1,
            },
            {
                index: 2,
                documentTitle: "Remote Work Security & Access Policy",
                documentId: "demo-doc-2",
                pageNumber: 3,
            },
        ],
        auditReport: {
            summary: "Found 2 relevant SOP documents matching your query on data retention and remote access guidelines.",
            findings: [],
            recommendations: [],
            relatedDocuments: [
                {
                    documentId: "demo-doc-1",
                    documentTitle: "Data Retention & Archival SOP",
                    pageNumber: 1,
                },
                {
                    documentId: "demo-doc-2",
                    documentTitle: "Remote Work Security & Access Policy",
                    pageNumber: 3,
                },
            ],
        },
    },
    {
        _id: "demo-sop-explanation",
        userQuery: "Can you explain our password security policy and how often we must rotate credentials?",
        userText: "",
        intent: "sop_explanation",
        confidenceScore: 0.96,
        status: "compliant",
        tags: ["sop-explanation", "Security", "Credentials"],
        createdAt: "2026-08-17T17:24:40.000Z",
        sourcesUsed: [
            {
                index: 1,
                documentTitle: "Enterprise Identity & Access Management SOP",
                documentId: "demo-doc-3",
                pageNumber: 4,
            },
        ],
        auditReport: {
            summary: "Our Enterprise Identity & Access Management policy requires all employee accounts to use strong passphrases combined with multi-factor authentication (MFA). Master database and cloud API keys must be rotated every 90 days or immediately upon suspected exposure.",
            findings: [],
            recommendations: [
                "Passwords must be at least 16 characters long and stored in an approved password manager.",
                "MFA must be enforced via authenticator app or hardware token (SMS authentication is disallowed).",
                "API keys and service tokens must be rotated automatically every 90 days or within 1 hour of any accidental public exposure.",
            ],
        },
    },
    {
        _id: "demo-1",
        userQuery: "Does my code review process follow the company SOP?",
        userText: "I usually quickly scan the code for syntax errors. I didn't run any tests. My review took about 5 minutes. No other reviewer was involved.",
        intent: "compliance_audit",
        confidenceScore: 0.95,
        status: "non_compliant",
        tags: ["Code Review", "SOP Compliance", "Engineering Process"],
        createdAt: "2026-08-17T18:24:40.000Z",
        sourcesUsed: [
            {
                index: 1,
                documentTitle: "Engineering Code Review Guidelines",
                documentId: "dummy-id-1",
                pageNumber: 2,
            },
            {
                index: 2,
                documentTitle: "Engineering Code Review Guidelines",
                documentId: "dummy-id-1",
                pageNumber: 3,
            },
        ],
        auditReport: {
            summary: "Hi there, after reviewing your submitted code review process, it appears there are several areas where your approach deviates from our established Standard Operating Procedures. This report outlines these observations to help you align with the company's guidelines.",
            findings: [
                {
                    title: "Insufficient Review Depth",
                    description: "Your statement about 'quickly scanning the code for syntax errors' indicates a narrower focus than what our SOP outlines. Code Review Guidelines require checking logic, security, and maintainability.",
                    status: "non_compliant",
                    sopReferences: [1],
                },
                {
                    title: "Lack of Test Verification",
                    description: "You mentioned that you 'didn't run any tests.' The SOP expects reviewers to verify that automated test suites pass prior to approval.",
                    status: "non_compliant",
                    sopReferences: [2],
                },
            ],
            recommendations: [
                "Broaden code review focus beyond syntax errors to include logic, security, style, and maintainability.",
                "Incorporate a step to verify test coverage and ensure all automated tests pass as part of your review process.",
            ],
        },
    },
    {
        _id: "demo-2",
        userQuery: "We had a production data leak. Does our incident response follow the SOP?",
        userText: "An engineer accidentally committed an AWS secret key to a public GitHub repo. The key was active for 24 hours. We deleted the repo but didn't rotate the key immediately. We didn't inform the security officer yet because it was a weekend.",
        intent: "compliance_audit",
        confidenceScore: 0.98,
        status: "needs_review",
        tags: ["Security Incident", "SOP Compliance", "Data Protection"],
        createdAt: "2026-08-17T19:24:40.000Z",
        escalated: true,
        escalatedToName: "Sneha Deshmukh",
        escalationMessage: "The engineering team failed to rotate compromised API credentials within the mandatory 1-hour window and failed to report a Grade-1 security incident to the Chief Security Officer immediately. Escalated to department head Sneha Deshmukh for intervention.",
        sourcesUsed: [
            {
                index: 1,
                documentTitle: "Enterprise Security Incident Response Protocol",
                documentId: "dummy-id-2",
                pageNumber: 1,
            },
        ],
        auditReport: {
            summary: "Critical compliance failure identified regarding incident response protocols. Immediate action is required to rotate compromised credentials and notify the security officer. Due to high severity, this case has been escalated.",
            findings: [
                {
                    title: "Delayed Credential Rotation",
                    description: "The compromised AWS secret key was left active for 24 hours. SOP mandates credential rotation within 1 hour of breach detection.",
                    status: "non_compliant",
                    sopReferences: [1],
                },
            ],
            recommendations: [
                "Rotate the compromised AWS secret key immediately.",
                "Notify the Chief Security Officer (CSO) and request credential audit log analysis.",
            ],
        },
    },
];

export default function DemoPage() {
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (query: string, text: string) => {
        setProcessing(true);
        // Simulate a delay for demo purposes
        setTimeout(() => {
            setProcessing(false);
            toast.info("Demo mode: Simulated response finished. (No actual API call was made).");
        }, 3000);
    };

    return (
        <div className="flex-1 flex flex-col w-full h-full relative">
            {/* Floating Header */}
            {/* <div className="absolute top-0 left-0 right-0 p-4 pl-16 md:pl-4 z-10 glass-panel border-x-0 border-t-0 rounded-none flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                <h1 className="text-sm font-semibold tracking-wide">Interactive Demo</h1>
                <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Read-only</span>
            </div> */}

            {/* Audit feed container with padding for floating header and footer */}
            <div className="flex-1 overflow-y-auto pt-16 relative">
                <AuditFeed logs={DEMO_LOGS} loading={false} processing={processing} />
                <div className="h-40 shrink-0 w-full" />
            </div>

            {/* Floating Chat input in read-only / disabled demo mode */}
            <ChatInput
                disabled={true}
                showSuggestions={false}
                placeholder="Interactive demo feed — Read-only mode"
            />
        </div>
    );
}
