"use client";

import { useState } from "react";
import { AuditFeed } from "@/components/audit-feed";
import { ChatInput } from "@/components/chat-input";
import { ShieldCheck, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import type { AuditLogEntry } from "@/components/audit-card";

// Demo data showcasing all agent intents connected to real cloud document IDs
const DEMO_LOGS: AuditLogEntry[] = [
    {
        _id: "demo-chitchat",
        userQuery: "Hello PolicyGuard! How can you help me today?",
        userText: "",
        intent: "chitchat",
        confidenceScore: 1.0,
        status: "compliant",
        tags: ["chitchat", "AI Assistant"],
        createdAt: "2026-08-17T15:24:40.000Z",
        sourcesUsed: [],
        auditReport: {
            summary: "Hello! I'm PolicyGuard, your autonomous AI compliance assistant. You can ask me to search company SOP documents, explain specific policies in plain language, or submit descriptions of your work for automated compliance auditing.",
            findings: [],
            recommendations: [],
        },
    },
    {
        _id: "demo-sop-search",
        userQuery: "Find SOP documents related to data retention and remote work expectations.",
        userText: "",
        intent: "sop_search",
        confidenceScore: 0.95,
        status: "compliant",
        tags: ["sop-search", "Data Retention", "Remote Work"],
        createdAt: "2026-08-17T16:24:40.000Z",
        sourcesUsed: [
            {
                index: 1,
                documentTitle: "Data Backup and Retention Policy",
                documentId: "6a8ac7deee7f7dde21feb804",
                pageNumber: 1,
            },
            {
                index: 2,
                documentTitle: "Remote Work Expectations and Procedures",
                documentId: "6a8ad091348e9332a9b38b6b",
                pageNumber: 1,
            },
        ],
        auditReport: {
            summary: "Found 2 active SOP documents matching your inquiry on company data retention guidelines and remote work procedures.",
            findings: [],
            recommendations: [],
            relatedDocuments: [
                {
                    documentId: "6a8ac7deee7f7dde21feb804",
                    documentTitle: "Data Backup and Retention Policy",
                    pageNumber: 1,
                },
                {
                    documentId: "6a8ad091348e9332a9b38b6b",
                    documentTitle: "Remote Work Expectations and Procedures",
                    pageNumber: 1,
                },
            ],
        },
    },
    {
        _id: "demo-sop-explanation",
        userQuery: "Can you explain our remote work expectations and home office security protocols?",
        userText: "",
        intent: "sop_explanation",
        confidenceScore: 0.97,
        status: "compliant",
        tags: ["sop-explanation", "Remote Work", "Security"],
        createdAt: "2026-08-17T17:24:40.000Z",
        sourcesUsed: [
            {
                index: 1,
                documentTitle: "Remote Work Expectations and Procedures",
                documentId: "6a8ad091348e9332a9b38b6b",
                pageNumber: 2,
            },
        ],
        auditReport: {
            summary: "Under the Remote Work Expectations and Procedures SOP, all remote team members must maintain a secure, private home workspace. Corporate VPN usage is mandatory when accessing internal systems, and laptops must have full-disk encryption and screen lock enabled.",
            findings: [],
            recommendations: [
                "Connect to the corporate WireGuard/OpenVPN tunnel prior to accessing staging or production systems.",
                "Ensure automatic screen lock is configured with a maximum 5-minute inactivity timeout.",
                "Maintain availability during core collaboration hours (10:00 AM – 4:00 PM local time).",
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
                documentTitle: "Mandatory Engineering Code Review and Quality Control Process",
                documentId: "6a836d57f079cd0cc2261708",
                pageNumber: 2,
            },
            {
                index: 2,
                documentTitle: "Mandatory Engineering Code Review and Quality Control Process",
                documentId: "6a836d57f079cd0cc2261708",
                pageNumber: 3,
            },
        ],
        auditReport: {
            summary: "After reviewing your submitted code review process, there are several critical deviations from our established Engineering Code Review and Quality Control SOP. The report outlines these findings to guide your team back into full compliance.",
            findings: [
                {
                    title: "Insufficient Review Depth & Duration",
                    description: "A 5-minute syntax scan violates the minimum 15-minute thorough logical and security review required before approving Pull Requests.",
                    status: "non_compliant",
                    sopReferences: [1],
                },
                {
                    title: "Lack of CI/CD Test Verification",
                    description: "Failing to execute automated tests or confirm test suite green status violates the mandatory pre-merge verification checkpoint.",
                    status: "non_compliant",
                    sopReferences: [2],
                },
            ],
            recommendations: [
                "Dedicate at least 15 minutes per review evaluating business logic, edge cases, error handling, and potential security vulnerabilities.",
                "Ensure all automated unit, integration, and security scans pass green in the CI/CD pipeline prior to granting PR approval.",
            ],
        },
    },
    {
        _id: "demo-2",
        userQuery: "We had an API key leak on GitHub. Does our incident response follow the SOP?",
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
                documentTitle: "Security Incident Response Protocol",
                documentId: "6a8acf5327cfc5ca7b2cdefc",
                pageNumber: 1,
            },
        ],
        auditReport: {
            summary: "Critical compliance failure identified regarding incident response protocols. Immediate action is required to rotate compromised credentials and notify the security officer. Due to high severity, this case has been escalated.",
            findings: [
                {
                    title: "Delayed Credential Rotation (Violates 1-Hour SLA)",
                    description: "The compromised secret key remained active for 24 hours. SOP mandates credential revocation and rotation within 60 minutes of detection.",
                    status: "non_compliant",
                    sopReferences: [1],
                },
                {
                    title: "Unreported Security Incident",
                    description: "Delaying reporting over a weekend violates the mandatory 15-minute Security Incident reporting SLA.",
                    status: "non_compliant",
                    sopReferences: [1],
                },
            ],
            recommendations: [
                "Rotate and invalidate the compromised AWS secret key immediately in the AWS IAM Console.",
                "Notify the Chief Information Security Officer (CISO) and trigger a full AWS CloudTrail audit log review.",
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
                placeholder="Interactive demo — Read-only mode"
            />
        </div>
    );
}
