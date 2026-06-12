# AWS Infrastructure Deployment & Orchestration Guide

This guide outlines the step-by-step deployment workflow for the SecondLife Commerce stack. Follow this execution order to bootstrap, deploy, and verify the platform components.

---

## 🛠️ Step 0: Prerequisites & Tooling
Before executing any deployment commands, ensure the following utilities are installed locally:
- **AWS CLI** (configured with admin access)
- **Node.js (v18+)** & **npm**
- **Go (v1.20+)** (for Lambda compilation)
- **AWS CDK CLI** (`npm install -g aws-cdk`)

---

## 🚀 Step-by-Step Deployment Roadmap

```
Step 1: Bootstrap Account ──► Step 2: Deploy Infrastructure ──► Step 3: Compile Go Lambdas
                                                                       │
Step 6: Run Frontend      ◄── Step 5: Seed Simulator Data   ◄── Step 4: Deploy Lambdas
```

---

### Step 1: AWS Account Bootstrapping
Before deploying CDK stacks, the AWS account and target region must be bootstrapped to provision CDK deployment buckets.

* **Execute Command**:
  ```powershell
  cdk bootstrap aws://331608077815/us-east-1
  ```
* **Execution Boundary**: Run once per account/region combo.

---

### Step 2: Deploy Core Infrastructure (S3, DynamoDB, Cognito)
Deploy the state and authentication layers first, as the backend microservices depend on their outputs (ARNs, table names).

* **CDK Command**:
  ```powershell
  cdk deploy SecondLifeCoreStack
  ```
* **Deployed Resources**:
  - DynamoDB Single-Table (`SecondLifeTable`)
  - Cognito User Pool (`SecondLifeUserPool`)
  - S3 Storage Buckets (`secondlife-inspections`, `secondlife-certificates`)
  - IAM Roles for Bedrock and Location Service

---

### Step 3: Compile Go Lambda Microservices
Go Lambdas must be compiled into Linux-compatible binaries before CDK packages them.

* **Compilation Commands** (Run inside `/backend`):
  ```powershell
  # Compile for AWS Lambda execution environment (Linux/amd64)
  $env:GOOS="linux"
  $env:GOARCH="amd64"
  $env:CGO_ENABLED="0"
  
  go build -o bin/user-service services/user/main.go
  go build -o bin/inspection-service services/inspection/main.go
  go build -o bin/routing-service services/routing/main.go
  go build -o bin/match-service services/match/main.go
  go build -o bin/carbon-service services/carbon/main.go
  ```
* **Execution Boundary**: Run every time you make changes to the Go backend source code.

---

### Step 4: Deploy API Gateway & Go Lambda Stack
Deploys the compiled Lambda functions, API Gateway mappings, and EventBridge integrations.

* **CDK Command**:
  ```powershell
  cdk deploy SecondLifeBackendStack
  ```
* **Deployed Resources**:
  - 6 Go Lambda functions
  - API Gateway REST API endpoints
  - EventBridge Event Bus & Routing Rules
  - Step Functions State Machines (Saga workflows)

---

### Step 5: Data Seeding & Simulator Launch
To demonstrate the platform at scale to judges, seed catalog products and active user demands across the target coordinate radius.

* **Execute Script** (Run inside `/backend/scripts`):
  ```powershell
  go run seed_simulator.go
  ```
* **Execution Boundary**: Run once post-deployment to seed 1,000+ coordinates and dummy transactions.

---

### Step 6: Launch Frontend Storefront & Admin Portal
Finally, start the React application locally or deploy it to CloudFront.

* **Local Run** (Run inside `/frontend`):
  ```powershell
  npm install
  npm run dev
  ```
* **Build for Production / CloudFront Deploy**:
  ```powershell
  npm run build
  cdk deploy SecondLifeFrontendStack
  ```
