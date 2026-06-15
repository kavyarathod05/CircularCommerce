# Database Schema

## Overview

SecondLife Commerce uses **Amazon DynamoDB** (on-demand billing) with optional Redis catalog cache.

> **Note:** Two naming conventions exist from iterative development. Production deployments should consolidate to the SAM-defined names (`Listings`, `Orders`, etc.) or standardize on `*Table` suffix used by ML engines.

## Tables

### Listings / SecondLife_Listings

| Attribute | Type | Description |
|-----------|------|-------------|
| listingId (PK) | S | Unique listing ID |
| name | S | Product name |
| msrp | N/S | Original MSRP |
| price | N/S | Current price |
| condition | S | Grade A/B/C |
| status | S | available \| reserved \| sold |
| escrowStatus | S | N/A \| Locked \| Released |
| owner | S | Seller display name |
| discount | N/S | Discount fraction |
| geohash | S | Location index (GSI) |

**GSI:** `Geohash-index` on `Geohash`

### Orders / OrdersTable

| Attribute | Type | Description |
|-----------|------|-------------|
| OrderId (PK) | S | Order identifier |
| ProductId | S | Product reference |
| OriginalPrice | N | Purchase price |
| SellerId | S | Seller reference |

### Returns / ReturnsTable

| Attribute | Type | Description |
|-----------|------|-------------|
| ReturnId (PK) | S | Return identifier |
| UserId | S | Buyer (GSI) |
| pathway | S | hyperlocal-p2p \| warehouse |
| SellerId | S | Seller reference |

**GSI:** `UserId-index`

### CarbonMetrics

| Attribute | Type | Description |
|-----------|------|-------------|
| metricId (PK) | S | Metric record |
| sellerId | S | Seller |
| co2_saved_kg | N | CO₂ avoided |

### VtoSessionsTable (optional)

Enabled with `USE_DYNAMODB_VTO=1`. Stores VTO session metadata.

### WsConnections

WebSocket connection registry for real-time logistics events.

## Seeding

```bash
# ML engine tables
python database/seeds/seed_dynamodb.py

# Catalog table
python database/seeds/setup_aws.py
```

## Indexes & Query Patterns

| Use case | Pattern |
|----------|---------|
| Catalog browse | `Scan` + Redis cache (TTL 3600s) |
| Hyperlocal demand | `Query` Geohash-index |
| Fraud graph | `Query` UserId-index on Returns |
| Friction scoring | `Query` UserId-index |
| Dynamic pricing | `Scan` competitor prices by product |

## Data Integrity

- Listing transitions use conditional `UpdateItem` state machine
- Blockchain DPP uses in-memory hash chain (upgrade to `BLOCKCHAIN_MODE=on-chain` for production)
- Auth users: in-memory store (migrate to Cognito + DynamoDB Users table for production)

## Normalization Recommendations

1. Unify table names under single CloudFormation stack
2. Add `GSI` on `sellerId` for seller metrics queries
3. Persist unit inventory to DynamoDB instead of in-memory engine
4. Move auth to Cognito; remove demo password seeding in production
