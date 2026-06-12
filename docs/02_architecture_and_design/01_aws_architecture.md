# AWS System Architecture & Diagrams

## 1. Simplified AWS Architecture Service Map

The SecondLife Commerce platform is built on a simplified, highly cost-effective serverless architecture designed for rapid deployment in a hackathon setting. It uses a Go monolithic backend running on AWS Lambda with Function URLs, storing structured data in Amazon DynamoDB, uploading media to Amazon S3, and utilizing Amazon Bedrock for AI-powered product inspection and grading.

| AWS Service | Role in Platform | Why We Chose It |
|-------------|------------------|-----------------|
| React + Tailwind | Customer App, Seller Dashboard, Operations Portal | Rapid UI development and responsive design |
| AWS Amplify | Frontend Hosting | CI/CD, global CDN, SSL, easy deployment |
| AWS Lambda (Go) | Backend Business Logic | Fully serverless, scales automatically, hackathon-friendly |
| Lambda Function URL | Public API Endpoint | Eliminates API Gateway setup overhead |
| Amazon DynamoDB | Primary Database | Fast NoSQL storage, flexible schema, serverless |
| Amazon S3 | Image & Document Storage | Product photos, inspection reports, certificates |
| Amazon Bedrock | AI Inspection & Intelligence | Product grading, damage analysis, listing generation |

---

## 2. Service Interaction Summary

```text
Customer / Seller App (React on Amplify)

        │
        ▼

AWS Lambda Function URL (Go Backend)

        ├──► Amazon DynamoDB
        │      Users
        │      Returns
        │      Listings
        │      Match Logs
        │
        ├──► Amazon S3
        │      Product Images
        │      Inspection Reports
        │
        └──► Amazon Bedrock
               Product Inspection
               AI Grading
               Listing Generation
```

---

# 3. Architecture Diagrams

## 3.1 High-Level Architecture

```mermaid
graph TB

    subgraph Client_Layer
        FE[React Frontend]
        AMP[AWS Amplify]
    end

    subgraph Backend_Layer
        LAMBDA[Go Lambda Backend]
    end

    subgraph Storage_Layer
        DDB[DynamoDB]
        S3[S3 Storage]
    end

    subgraph AI_Layer
        BEDROCK[Amazon Bedrock]
    end

    FE --> AMP
    FE --> LAMBDA

    LAMBDA --> DDB
    LAMBDA --> S3
    LAMBDA --> BEDROCK
```

---

## 3.2 Detailed AWS Architecture

```mermaid
graph LR

    USER[Customer or Seller]

    subgraph Frontend
        FE[React App]
        AMP[AWS Amplify]
    end

    subgraph Backend
        LF[Lambda Function URL]
        GO[Go Application]
    end

    subgraph Storage
        DDB[DynamoDB]
        S3[S3 Bucket]
    end

    subgraph AI
        BR[Amazon Bedrock]
    end

    USER --> FE
    FE --> AMP

    FE --> LF

    LF --> GO

    GO --> DDB
    GO --> S3
    GO --> BR
```

---

## 3.3 AI Inspection Workflow

```mermaid
sequenceDiagram

    participant User
    participant Lambda
    participant S3
    participant Bedrock
    participant DynamoDB

    User->>Lambda: Upload Product Images

    Lambda->>S3: Store Images
    S3-->>Lambda: Image URL

    Lambda->>Bedrock: Analyze Images

    Bedrock-->>Lambda: Product Grade
    Bedrock-->>Lambda: Damage Detection
    Bedrock-->>Lambda: Fraud Signals
    Bedrock-->>Lambda: Listing Description

    Lambda->>DynamoDB: Save Inspection

    Lambda-->>User: Inspection Result
```

---

## 3.4 Smart Routing Workflow

```mermaid
flowchart TD

    A[Return Requested]

    A --> Triage{Margin Triage Gate}

    Triage -->|Track A: Premium| B[AI Inspection]
    Triage -->|Track B: Commodity| LC[Keep-and-Credit / Liquidate]

    B --> C{Product Grade}

    C -->|Grade A| D[Check Local Demand]

    C -->|Grade B| E[Evaluate Refurbishment]

    C -->|Grade C| F[Recycle or Donate]

    D --> G{Buyer Available}

    G -->|Yes| H[Reserve Product]

    G -->|No| I[Create Marketplace Listing]

    E --> J{Repair Economical}

    J -->|Yes| I

    J -->|No| F

    H --> K[Notify Buyer]

    K --> L[Update DynamoDB]

    I --> M[Publish Listing]

    F --> N[Record Sustainability Impact]
```

---

## 3.5 Direct-to-Next-Owner Workflow

```mermaid
flowchart LR

    A[Customer Initiates Return]

    B[Upload Product Images]

    C[AI Inspection]

    D[Demand Matching Engine]

    E{Local Buyer Found}

    F[Buyer Reservation]

    G[Direct Shipment]

    H[Marketplace Listing]

    I[Warehouse Route]

    A --> B
    B --> C
    C --> D

    D --> E

    E -->|Yes| F
    E -->|No| H

    F --> G

    H --> I
```

---

## 3.6 Marketplace Listing Generation Workflow

```mermaid
flowchart TD

    A[Product Images]

    B[Bedrock Analysis]

    C[Condition Grade]

    D[Auto Generated Title]

    E[Auto Generated Description]

    F[Suggested Price]

    G[Marketplace Listing]

    A --> B

    B --> C
    B --> D
    B --> E
    B --> F

    C --> G
    D --> G
    E --> G
    F --> G
```

---

## 3.7 Hyperlocal Matching Engine

```mermaid
flowchart TD

    A[Grade A Product]

    B[Search Nearby Buyers]

    C[Calculate Match Score]

    D[Rank Candidates]

    E{Best Match Found}

    F[Reserve Item]

    G[Create Public Listing]

    A --> B

    B --> C

    C --> D

    D --> E

    E -->|Yes| F

    E -->|No| G
```

---

## 3.8 Data Flow Diagram

```mermaid
graph LR

    A[User Uploads Images]

    B[S3 Storage]

    C[Bedrock Analysis]

    D[Go Lambda Backend]

    E[DynamoDB]

    F[Marketplace]

    G[Matching Engine]

    H[Carbon Dashboard]

    A --> B

    B --> C

    C --> D

    D --> E

    E --> F

    E --> G

    E --> H
```

---

## 3.9 End-to-End Product Lifecycle

```mermaid
flowchart TD
    %% Styling
    classDef frontend fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef ai_module fill:#faf5ff,stroke:#7c3aed,stroke-width:2px;
    classDef routing_module fill:#fff7ed,stroke:#ea580c,stroke-width:2px;
    classDef match_module fill:#ecfdf5,stroke:#059669,stroke-width:2px;
    classDef trust_module fill:#fef2f2,stroke:#dc2626,stroke-width:2px;
    classDef carbon_module fill:#f0fdf4,stroke:#16a34a,stroke-width:2px;
    classDef prevention_module fill:#f8fafc,stroke:#64748b,stroke-width:2px;

    %% PILLAR 04: PRE-PURCHASE RETURN PREVENTION ENGINE
    subgraph Pre-Purchase Prevention Engine
        P1[User Interacts on Storefront] --> P2{Predictive Return ML: Check Sizing & Cart Anomalies}
        P2 -->|High Return Probability| P3[Inject Dynamic UI Friction: 'Profile Match Size Suggestion']
        P2 -->|Low Risk| P4[Frictionless Order Completion]
    end
    class P1,P2,P3,P4 prevention_module;

    %% 1. Initiation & Margin Triage Gate
    subgraph Client App
        P4 --> A1[Customer Still Needs to Initiate Return]
        A1 --> A2[Uploads 3-5 Product Photos]
        A2 --> MT{Margin Triage Gate: Evaluate MSRP}
    end
    class A1,A2,MT frontend;

    %% 2. PILLAR 01: AI Product Inspection Module
    subgraph AI Product Inspection Module
        B1[Amazon Bedrock Engine]
        B2[Image & Surface Damage Analysis]
        B3[Variant Validation & Fraud Check]
        B4[Generate Condition Grade: A/B/C/D]
        
        MT -->|High Value >= 5000| B1
        B1 --> B2
        B1 --> B3
        B2 & B3 --> B4
    end
    class B1,B2,B3,B4 ai_module;

    %% COMMODITY LEAN PATHWAY (The 500 Item Hack)
    subgraph Low-Margin Commodity Bypass
        MT -->|Low Value < 5000| LB[Go Lambda: Logistics Cost vs Value Check]
        LB --> L_CHECK{Local Lockers/Bins < 5km?}
        L_CHECK -->|Yes| LOCKER[Label-Free Micro-Consolidation Locker Drop]
        L_CHECK -->|No| FRAUD{User Return-Risk Score}
        FRAUD -->|Clean Account| KEEP[Keep & Credit: Automated Refund + Eco-Points]
        FRAUD -->|Flagged Account| LOCKER
    end
    class LB,L_CHECK,LOCKER,FRAUD,KEEP routing_module;

    %% 3. PILLAR 03: Trust & Transparency Engine
    subgraph Trust & Transparency Engine
        C1[Generate Digital Condition Certificate / Health Card]
        C2[Map Bounding Boxes of Damage]
        C3[Create Public Verification Link]
        
        B4 --> C1
        B4 --> C2
        C1 & C2 --> C3
    end
    class C1,C2,C3 trust_module;

    %% 4. PILLAR 02: Smart Routing Engine
    subgraph Smart Routing Engine
        D1{Evaluate Decision Matrix}
        D2[Check Repair Cost]
        D3[Check Seller Overrides]
        
        B4 --> D1
        D1 --> D2
        D1 --> D3
        
        D1 -->|Grade A + High Demand| PATH_A[Hyperlocal Direct-to-Buyer]
        D1 -->|Grade B + Low Repair Cost| PATH_B[Marketplace Relisting]
        D1 -->|Grade C / High Repair Cost| PATH_C[Refurbishment or Liquidation]
        D1 -->|Grade D| PATH_D[Recycling / Donation]
    end
    class D1,D2,D3 routing_module;

    %% 5. Hyperlocal Demand Matching Engine
    subgraph Hyperlocal Demand Matching Engine
        E1[Extract Buyer Wishlists in 25km]
        E2[Calculate Match Score & Distance]
        E3[Dispatch 2-Hour Locked Offer to Buyer]
        E4{Offer Accepted?}
        
        PATH_A --> E1
        E1 --> E2
        E2 --> E3
        E3 --> E4
        E4 -->|Yes| E5[Reserve Item for Direct Logistics]
        E4 -->|No| PATH_B
    end
    class E1,E2,E3,E4,E5 match_module;

    %% 6. Carbon Optimization Engine
    subgraph Carbon Optimization Engine
        F1[Calculate Transport Legs Avoided]
        F2[Calculate Warehouse Days Avoided]
        F3[Compute CO2 Saved vs. Standard Route]
        F4[Update User Eco-Points & Dashboards]
        
        E5 --> F1
        PATH_B --> F1
        PATH_C --> F1
        PATH_D --> F1
        LOCKER --> F1
        KEEP --> F1
        
        F1 --> F2
        F2 --> F3
        F3 --> F4
    end
    class F1,F2,F3,F4 carbon_module;
```

---

## 4. DynamoDB Data Model

```text
Users
 ├── user_id (PK)
 ├── profile
 ├── role
 └── location

Products
 ├── product_id (PK)
 ├── owner_id
 ├── category
 └── status

Returns
 ├── return_id (PK)
 ├── product_id
 ├── inspection_id
 └── routing_status

Inspections
 ├── inspection_id (PK)
 ├── product_id
 ├── grade
 ├── damages
 └── confidence_score

Listings
 ├── listing_id (PK)
 ├── product_id
 ├── title
 ├── price
 └── status

CarbonMetrics
 ├── metric_id (PK)
 ├── product_id
 ├── co2_saved
 └── distance_saved
```

---

## 5. Request Lifecycle

```text
User Uploads Product Photos
        │
        ▼
Lambda Receives Request
        │
        ▼
Images Stored in S3
        │
        ▼
Bedrock Performs Inspection
        │
        ▼
Inspection Saved to DynamoDB
        │
        ▼
Routing Decision Generated
        │
        ▼
Match Buyer OR Create Listing
        │
        ▼
Carbon Impact Recorded
        │
        ▼
Response Returned to User
```