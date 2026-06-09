# Policy Guard

An AI-powered SOP compliance platform featuring multi-agent verification and hierarchical escalation.

## Running Locally

Run the following commands in separate terminals:
- Terminal 1: `npm run dev`
- Terminal 2: `npx inngest-cli@latest dev`

## Architecture & Database

Below is the database schema mapping the relationships between users, their organizational profiles, SOP documents, vectorized chunks, and compliance audit logs.

```mermaid
erDiagram
    users ||--o| user_profiles : "has profile"
    users ||--o{ sop_documents : "uploads"
    users ||--o{ audit_logs : "creates"
    user_profiles |o--o| user_profiles : "escalates to (manager)"
    sop_documents ||--o{ sop_chunks : "split into"
    audit_logs ||--o{ sop_documents : "references as source"

    users {
        string id PK "Managed by Better Auth"
        string name
        string email
        string password "hashed"
    }

    user_profiles {
        ObjectId _id PK
        string userId FK "References users.id"
        string role "admin | employee | manager"
        string department "Engineering | QA | HR | Data"
        string escalationManagerId FK "References users.id of their manager"
        Date createdAt
    }

    sop_documents {
        ObjectId _id PK
        string title
        string description
        string s3Key "S3 storage path"
        string thumbnailUrl "S3 storage path for thumbnail"
        string scope "global | department-specific"
        string[] departments
        string status "active | processing"
        string uploadedBy FK "References users.id"
    }

    sop_chunks {
        ObjectId _id PK
        ObjectId documentId FK "References sop_documents._id"
        string content
        number chunkIndex
        number pageNumber "Crucial for PDF citation proof"
        number[] embedding "Vector representation"
    }

    audit_logs {
        ObjectId _id PK
        string employeeId FK "References users.id"
        string userQuery
        string userText
        object auditReport "JSON of findings & recommendations"
        number confidenceScore
        array sourcesUsed "Array of { documentId, documentTitle, pageNumber }"
        string status "compliant | non_compliant | needs_review"
        boolean escalated
        string escalatedToId FK "References users.id of manager"
        string escalationMessage "Drafted by LLM"
    }
```