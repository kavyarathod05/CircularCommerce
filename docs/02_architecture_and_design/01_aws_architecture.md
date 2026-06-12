# AWS System Architecture & Diagrams

## 1. Complete AWS Architecture Service Map

The SecondLife Commerce platform is built on an event-driven serverless architecture using Go microservices running on AWS Lambda, storing data in Amazon DynamoDB and Amazon S3, and leveraging Amazon Bedrock for multimodal AI analysis.

| AWS Service | Role in Platform |
|---|---|
| **React + Tailwind (Frontend)** | Customer app, seller dashboard, ops portal |
| **CloudFront** | Global CDN for frontend assets, low-latency delivery |
| **S3** | Product photo storage, AI inspection reports, certificates |
| **Amazon Cognito** | User authentication — customers, sellers, ops users |
| **API Gateway** | REST API entry point, request routing, rate limiting, auth validation |
| **AWS Lambda (Go)** | All backend microservices — inspection, routing, matching, carbon, marketplace |
| **Amazon DynamoDB** | Primary data store — users, returns, inspections, listings, routing decisions |
| **Amazon Bedrock** | AI inspection engine — image analysis, grading, fraud detection, listing generation |
| **Amazon EventBridge** | Event bus — decouples services, drives async workflows |
| **Amazon SQS** | Message queues for inspection jobs, notification delivery |
| **Amazon SNS** | Push notifications — return status updates, buyer match alerts |
| **AWS Step Functions** | Orchestrate multi-step workflows — inspection → routing → matching |
| **Amazon Location Service** | Geocoding, distance calculation for hyperlocal matching |
| **Amazon OpenSearch** | Product search index for second-life marketplace listings |
| **Amazon CloudWatch** | Logging, metrics, alerting, distributed tracing |
| **AWS KMS** | Certificate signing, data encryption |
| **AWS WAF** | Web Application Firewall on API Gateway |
| **Amazon Athena** | Analytics queries on S3-exported DynamoDB data |

---

## 2. Service Interaction Summary

```
Customer App (React)
  → CloudFront
  → API Gateway (with Cognito auth + WAF)
  → Lambda (Go microservices)
  → DynamoDB (primary store)
  → S3 (images, certs)
  → Bedrock (AI inspection)
  → EventBridge (async events)
  → Step Functions (workflow orchestration)
  → SQS / SNS (queuing + notifications)
  → OpenSearch (search)
  → Location Service (geo)
  → CloudWatch (observability)
```

---

## 3. Architecture Diagrams

### 3.1 High-Level Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        CA[Customer App React]
        SD[Seller Dashboard React]
        OP[Ops Portal React]
    end

    subgraph Edge["Edge Layer"]
        CF[CloudFront CDN]
        WAF[AWS WAF]
        COG[Amazon Cognito]
    end

    subgraph API["API Layer"]
        APIG[API Gateway]
    end

    subgraph Services["Service Layer - Lambda Go"]
        US[User Service]
        IS[Inspection Service]
        RS[Routing Service]
        MS[Marketplace Service]
        HM[Hyperlocal Match Service]
        CS[Carbon Service]
        AS[Analytics Service]
    end

    subgraph Data["Data Layer"]
        DDB[DynamoDB]
        S3[S3 Bucket]
        OS[OpenSearch]
    end

    subgraph AI["AI Layer"]
        BK[Amazon Bedrock]
    end

    subgraph Events["Event Layer"]
        EB[EventBridge]
        SQS1[SQS - Inspection Queue]
        SQS2[SQS - Match Queue]
        SNS1[SNS - Notifications]
        SF[Step Functions]
    end

    subgraph Infra["Observability"]
        CW[CloudWatch]
        KMS[AWS KMS]
        LS[Location Service]
    end

    CA --> CF
    SD --> CF
    OP --> CF
    CF --> WAF
    WAF --> APIG
    APIG --> COG
    APIG --> US
    APIG --> IS
    APIG --> RS
    APIG --> MS
    APIG --> HM
    APIG --> CS
    APIG --> AS
    IS --> BK
    IS --> S3
    IS --> DDB
    RS --> DDB
    RS --> EB
    HM --> LS
    HM --> DDB
    MS --> OS
    MS --> DDB
    CS --> DDB
    EB --> SF
    SF --> SQS1
    SF --> SQS2
    SQS1 --> IS
    SQS2 --> HM
    SNS1 --> CA
```

---

### 3.2 AI Inspection Workflow

```mermaid
sequenceDiagram
    participant C as Customer App
    participant AG as API Gateway
    participant IS as Inspection Service
    participant S3 as S3 Storage
    participant BK as Amazon Bedrock
    participant DDB as DynamoDB
    participant EB as EventBridge

    C->{AG: POST /inspections with photos
    AG->{IS: Forward request
    IS->{S3: Upload product images
    S3-->>IS: Image URLs
    IS->{BK: Invoke model with images + prompt
    BK-->>IS: Inspection result (grade, damages, fraud signals)
    IS->{DDB: Save inspection record
    IS->{EB: Emit inspection.completed event
    IS-->>C: Return inspection result + certificate URL
```

---

### 3.3 Smart Routing Workflow

```mermaid
flowchart TD
    A[Inspection Completed Event] --> B[Routing Service]
    B --> C{Grade A?}
    C -->|Yes| D{Local Demand High?}
    D -->|Yes| E[Hyperlocal Match]
    D -->|No| F[Marketplace Relist]
    C -->|No| G{Grade B?}
    G -->|Yes| H{Repair Cost Low?}
    H -->|Yes| I{Local Demand?}
    I -->|Yes| E
    I -->|No| F
    H -->|No| J[Refurbishment Center]
    G -->|No| K{Grade C?}
    K -->|Yes| L[Refurb or Liquidation]
    K -->|No| M[Recycling or Donation]
    E --> N[Emit match.requested event]
    F --> O[Create Listing in OpenSearch]
    J --> P[Create Work Order in DDB]
    L --> Q[Liquidation Queue]
    M --> R[Sustainability Impact Log]
```

---

### 3.4 Direct-to-Next-Owner Workflow

```mermaid
sequenceDiagram
    participant S as Seller
    participant C as Customer
    participant HM as Hyperlocal Match Service
    participant LS as Location Service
    participant NB as Next Buyer
    participant SNS as SNS Notifications
    participant LP as Logistics Partner

    C->>HM: Return approved, Grade A, location known
    HM->>LS: Geocode return origin
    LS-->>HM: Coordinates
    HM->>HM: Score local buyers within 25km
    HM->>SNS: Send offer to top 3 buyers
    SNS->>NB: Push: "Product available near you"
    NB->>HM: Accept offer within 2-hour window
    HM->>LP: Trigger pickup request
    HM->>C: Notify original returner
    HM->>S: Notify seller of direct match
    LP->>NB: Deliver product
    HM->>HM: Log carbon savings (warehouse avoided)
```

---

### 3.5 Event-Driven Architecture

```mermaid
graph LR
    subgraph Producers["Event Producers"]
        IS[Inspection Service]
        RS[Routing Service]
        HM[Hyperlocal Match]
        MS[Marketplace Service]
    end

    subgraph Bus["EventBridge"]
        EB[Event Bus]
    end

    subgraph Consumers["Event Consumers"]
        SF[Step Functions]
        CS[Carbon Service]
        SNS[SNS Notifications]
        AS[Analytics Service]
        WH[Webhook Relay]
    end

    IS -->|inspection.completed| EB
    RS -->|routing.decided| EB
    HM -->|match.accepted| EB
    HM -->|match.expired| EB
    MS -->|listing.published| EB
    MS -->|listing.sold| EB
    EB -->|trigger workflow| SF
    EB -->|update carbon| CS
    EB -->|notify users| SNS
    EB -->|log analytics| AS
    EB -->|notify seller| WH
```

---

### 3.6 Data Flow Diagram

```mermaid
graph TD
    A[Customer uploads photos] --> B[S3 Raw Images]
    B --> C[Bedrock AI Analysis]
    C --> D[Inspection Record - DynamoDB]
    D --> E[Routing Decision - DynamoDB]
    E --> F{Routing Path}
    F -->|Hyperlocal| G[Buyer Match Record - DynamoDB]
    F -->|Marketplace| H[OpenSearch Listing Index]
    F -->|Refurb| I[Work Order - DynamoDB]
    G --> J[Carbon Metric - DynamoDB]
    H --> J
    I --> J
    J --> K[Analytics Export - S3]
    K --> L[Athena Queries]
    L --> M[Seller Reports]
```
