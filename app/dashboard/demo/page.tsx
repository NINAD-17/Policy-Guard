"use client";

import { useState } from "react";
import { AuditFeed } from "@/components/audit-feed";
import { ChatInput } from "@/components/chat-input";
import { ShieldCheck, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import type { AuditLogEntry } from "@/components/audit-card";

// Hardcoded demo data
const DEMO_LOGS: AuditLogEntry[] = [
    {
        _id: "demo-1",
        userQuery: "Does my code review process follow the company SOP?",
        userText: "I usually quickly scan the code for syntax errors. I didn't run any tests. My review took about 5 minutes. No other reviewer was involved.",
        confidenceScore: 0.95,
        status: "non_compliant",
        tags: ["Code Review", "SOP Compliance", "Engineering Process"],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
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
            {
                index: 3,
                documentTitle: "Engineering Code Review Guidelines",
                documentId: "dummy-id-1",
                pageNumber: 4,
            },
            {
                index: 4,
                documentTitle: "Engineering Code Review Guidelines",
                documentId: "dummy-id-1",
                pageNumber: 5,
            }
        ],
        auditReport: {
            summary: "Hi there, after reviewing your submitted code review process, it appears there are several areas where your approach deviates from our established Standard Operating Procedures. This report outlines these observations to help you align with the company's guidelines and enhance the quality of your reviews.",
            findings: [
                {
                    title: "Insufficient Review Depth",
                    description: "Your statement about 'quickly scanning the code for syntax errors' indicates a narrower focus than what our SOP outlines. The Code Review Guidelines expect reviewers to examine code for logic, security, style, correctness, maintainability, and consistency, which goes beyond just syntax checks.",
                    status: "non_compliant",
                    sopReferences: [1, 2, 4],
                },
                {
                    title: "Lack of Test Verification",
                    description: "You mentioned that you 'didn't run any tests.' While the SOP primarily places the responsibility for ensuring test coverage on the author, a thorough review often involves verifying that automated tests pass.",
                    status: "non_compliant",
                    sopReferences: [4],
                },
                {
                    title: "Inadequate Review Duration",
                    description: "Your 5-minute review duration for a pull request is generally insufficient to thoroughly cover all the checks mandated by our guidelines.",
                    status: "non_compliant",
                    sopReferences: [1, 2, 3, 4],
                },
                {
                    title: "Single Reviewer Process",
                    description: "Your statement 'No other reviewer was involved' is compliant with the provided SOP content, as it does not explicitly mandate multiple reviewers for a pull request.",
                    status: "compliant",
                    sopReferences: [1],
                }
            ],
            recommendations: [
                "You might want to broaden your code review focus beyond syntax errors to include logic, security, style, correctness, and maintainability.",
                "Consider incorporating a step to verify test coverage and ensure all automated tests pass as part of your review process.",
                "Allocate sufficient time for each code review to thoroughly address all aspects of the review checklist.",
            ],
        },
    },
    {
        _id: "demo-1",
        userQuery: "Does my code review process follow the company SOP?",
        userText: "I usually quickly scan the code for syntax errors. I didn't run any tests. My review took about 5 minutes. No other reviewer was involved.",
        confidenceScore: 0.95,
        status: "non_compliant",
        tags: ["Code Review", "SOP Compliance", "Engineering Process"],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
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
            {
                index: 3,
                documentTitle: "Engineering Code Review Guidelines",
                documentId: "dummy-id-1",
                pageNumber: 4,
            },
            {
                index: 4,
                documentTitle: "Engineering Code Review Guidelines",
                documentId: "dummy-id-1",
                pageNumber: 5,
            }
        ],
        auditReport: {
            summary: "Hi there, after reviewing your submitted code review process, it appears there are several areas where your approach deviates from our established Standard Operating Procedures. This report outlines these observations to help you align with the company's guidelines and enhance the quality of your reviews.",
            findings: [
                {
                    title: "Insufficient Review Depth",
                    description: "Your statement about 'quickly scanning the code for syntax errors' indicates a narrower focus than what our SOP outlines. The Code Review Guidelines expect reviewers to examine code for logic, security, style, correctness, maintainability, and consistency, which goes beyond just syntax checks.",
                    status: "non_compliant",
                    sopReferences: [1, 2, 4],
                },
                {
                    title: "Lack of Test Verification",
                    description: "You mentioned that you 'didn't run any tests.' While the SOP primarily places the responsibility for ensuring test coverage on the author, a thorough review often involves verifying that automated tests pass.",
                    status: "non_compliant",
                    sopReferences: [4],
                },
                {
                    title: "Inadequate Review Duration",
                    description: "Your 5-minute review duration for a pull request is generally insufficient to thoroughly cover all the checks mandated by our guidelines.",
                    status: "non_compliant",
                    sopReferences: [1, 2, 3, 4],
                },
                {
                    title: "Single Reviewer Process",
                    description: "Your statement 'No other reviewer was involved' is compliant with the provided SOP content, as it does not explicitly mandate multiple reviewers for a pull request.",
                    status: "compliant",
                    sopReferences: [1],
                }
            ],
            recommendations: [
                "You might want to broaden your code review focus beyond syntax errors to include logic, security, style, correctness, and maintainability.",
                "Consider incorporating a step to verify test coverage and ensure all automated tests pass as part of your review process.",
                "Allocate sufficient time for each code review to thoroughly address all aspects of the review checklist.",
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

            {/* Audit feed container */}
            <div className="flex-1 overflow-y-auto pt-16 relative">
                <AuditFeed logs={DEMO_LOGS} loading={false} processing={processing} />
                <div className="h-40 shrink-0 w-full" />
            </div>

            {/* Floating Chat input */}
            <ChatInput onSubmit={handleSubmit} loading={processing} />
        </div>
    );
}
