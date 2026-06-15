# API Reference

Base URL (local): `http://localhost:8000`  
Auth: Bearer JWT (except `/auth/*`, `/health`)

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Create account |
| POST | `/auth/login` | None | Obtain JWT |
| GET | `/auth/me` | JWT | Current user profile |
| GET | `/auth/users` | Admin | List users |

### Register / Login Request
```json
{ "email": "user@example.com", "password": "secret", "name": "Name", "role": "buyer" }
```

### Token Response
```json
{ "access_token": "<jwt>", "token_type": "bearer", "user": { "id": "usr-...", "role": "buyer" } }
```

## Catalog & Listings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/catalog` | Active listings (DynamoDB + cache) |
| POST | `/listing/create` | Create listing |
| POST | `/listing/{id}/transition` | Escrow state machine |
| PUT | `/listing` | Update listing status |

## ML & AI

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ml/friction/evaluate` | Return-risk at checkout |
| POST | `/api/v1/ml/pricing/dynamic` | Dynamic price |
| POST | `/api/v1/ml/demand/rank` | Hyperlocal demand ranking |
| POST | `/api/v1/ml/triage` | Return disposition routing |
| POST | `/api/v1/ml/aws/inspect-condition` | Image condition grading (Gemini) |
| POST | `/api/v1/ml/inspect-video` | Video grading (requires GEMINI_API_KEY) |
| POST | `/api/v1/ml/negotiate` | Partial-refund negotiation |
| POST | `/api/v1/ml/fraud-graphrag` | Fraud network analysis |
| GET | `/api/v1/ml/fraud/trust-score/{user_id}` | Trust score |
| POST | `/api/v1/ml/size/recommend` | Size recommendation |
| POST | `/api/vto/generate` | Virtual try-on (multipart) |
| POST | `/api/v1/ml/vto/drape` | VTO legacy JSON |

## Sustainability & Metrics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/seller/metrics` | Seller CO₂, escrow, avoidance rate |
| GET | `/user/metrics` | Buyer green credits, CO₂ saved |
| GET | `/dpp` | Digital Product Passport |

## Compliance & Verification

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/gs1/verify/{gtin}` | GTIN verification |
| POST | `/api/v1/vision/verify-serial` | Serial OCR |
| POST | `/api/v1/compliance/check` | Regulatory routing check |

## Logistics & Optimization

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/logistics/*` | Fleet telemetry snapshots |
| POST | `/api/v1/routing/optimize` | NSGA-II route optimization |
| POST | `/api/v1/fleet/optimize` | Fleet GA optimization |

## Go Serverless API (AWS)

Deployed separately via SAM (`backend/serverless-api/`):

| Method | Path | Description |
|--------|------|-------------|
| POST | `/return/intercept` | Return interception + carbon calc |
| GET | `/return/media-url` | S3 presigned upload URL |
| POST | `/escrow/lock` | Lock escrow funds |
| POST | `/escrow/release` | Release escrow |
| ANY | `/listing` | Listing CRUD |
| ANY | `/dpp` | DPP operations |

## Error Format

```json
{ "detail": "Human-readable error message" }
```

HTTP status codes: `400` validation, `401` auth, `403` RBAC, `503` missing AI configuration, `500` server error.

## Versioning

Current version: **v1** (prefix `/api/v1/`). Breaking changes will increment to `/api/v2/`.
