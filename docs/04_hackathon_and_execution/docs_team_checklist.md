# Hackathon Team Database-Backed ML Integration Checklist

> [!IMPORTANT]
> **Database-Driven ML Architecture:** To eliminate client-side hardcoding, the Python ML microservice must fetch its input data (historical return counts, listing locations, pricing matrices, transaction networks) directly from the AWS DynamoDB database tables via Boto3. The React frontends must only send simple identifiers (e.g., `user_id`, `product_id`, `order_id`), leaving all data aggregation to the backend database layer.

---

## ☁️ Kavya (AWS Infrastructure, Table Setup & IAM Provisioning)

Your focus is establishing the DynamoDB tables, seeding mock testing data representing e-commerce history, and ensuring the ML service has access permissions.

### 1. DynamoDB Table Provisioning & Seeding
- [ ] **Configure DynamoDB Tables:** Ensure the standard schemas are live:
  * `OrdersTable` (Partition Key: `OrderId` S)
  * `ReturnsTable` (Partition Key: `ReturnId` S, Global Secondary Index: `UserId-index`)
  * `ListingsTable` (Partition Key: `ListingId` S, Local Secondary Index: `Geohash-index`)
  * `MatchesTable` (Partition Key: `MatchId` S)
- [ ] **Seed E-Commerce Test Data:** Provision mock records inside DynamoDB so Naman's ML service can run lookup queries:
  * Seed 5+ orders in `OrdersTable` (mapping `ProductId` to `OriginalPrice` and `SellerId`).
  * Seed return history in `ReturnsTable` (mapping `UserId` to prior returns for velocity scoring).
  * Seed listings in `ListingsTable` (including competitor price arrays and location geohashes).

### 2. IAM Policy Configuration for Local ML Access
- [ ] **Local Machine IAM Role:** Create an IAM Policy (`SecondLifeMLAccess`) allowing read/write actions on your DynamoDB tables:
  * Actions: `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:Query`, `dynamodb:Scan`
  * Resources: `arn:aws:dynamodb:*:*:table/*`
- [ ] **AWS credentials propagation:** Configure local environment profiles so Naman's python Boto3 scripts can inherit access credentials automatically.

---

## 🧠 Naman (FastAPI ML Service Boto3 Integrations & UI Alignment)

Your focus is refactoring the Python ML sub-engines to execute Boto3 queries on DynamoDB, discarding hardcoded payload arguments.

### 1. Predictive Friction Engine (`predictive_friction.py`)
- [ ] **Live Return History Query:** Instead of accepting `user_history` from the client request body, use Boto3's `query` to count the user's records in the `ReturnsTable` matching the provided `user_id`.
- [ ] **Compute Real Probability:** Retrieve `OriginalPrice` from the `OrdersTable` to weight high-value return risk.

### 2. GenAI Dynamic Pricing Engine (`dynamic_pricing.py`)
- [ ] **Live Competitor Pricing Lookup:** Modify the endpoint to accept a `product_id`. Use Boto3's `scan` or `query` on `ListingsTable` to scan similar items and construct the competitor price array dynamically.
- [ ] **Automatic Price Adjustments:** Calculate discount rates using the dynamic list.

### 3. Local Demand Engine (`demand_engine.py`)
- [ ] **Spatial Geohash Queries:** Update `rank_buyers` to query `ListingsTable` using the `Geohash-index` LSI. Filter candidate listings near the returning user's location, matching spatial logs directly from DynamoDB.

### 4. SEFraud GNN Trust Scoring (`network_fraud.py`)
- [ ] **Graph Construction from Matches:** Replace the mock graph generator. Query `MatchesTable` and `ReturnsTable` to build an active transaction adjacency matrix (mapping user nodes sharing IPs, devices, or transaction histories) to calculate the SEFraud GNN trust score.

### 5. Client UI Form Cleanups
- [ ] **React Form Refactor:** Simplify the POST payloads inside the React frontends. Replace complex mock arrays with flat requests (e.g., passing `{ "user_id": "usr-kavya" }` or `{ "product_id": "p-smartphone" }`), letting the backend do the heavy lookup work.


