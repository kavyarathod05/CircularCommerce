# Scalability Review

## Horizontal Scaling

| Component | Stateless? | Scale mechanism |
|-----------|------------|-----------------|
| FastAPI gateway | Yes | ECS/Lambda replicas behind ALB |
| Go return-intercept | Yes | Lambda concurrency |
| React SPA | Yes | S3 + CloudFront |
| Redis cache | N/A | ElastiCache cluster |
| DynamoDB | N/A | On-demand auto-scale |

## Bottlenecks

1. **VTO inference** — CPU-bound; requires GPU pool + async queue
2. **Gemini API calls** — rate limits; add caching by image hash
3. **Catalog scan** — mitigated by Redis 3600s TTL
4. **In-memory auth** — blocks multi-instance; migrate to Cognito
5. **Blockchain DPP in-memory** — not shared across instances

## Caching Strategy

- Catalog: Redis (`catalog_cache.py`) with in-memory fallback
- Product registry: static Python dict (immutable, process-local OK)
- VTO output: filesystem `vto-storage/` (move to S3 + CloudFront)

## Async Opportunities

- Return triage: SQS → Lambda for image processing
- Fraud graph: nightly batch + stream updates on new returns
- Fleet telemetry: Kinesis → analytics

## Target Architecture at Scale

```
CloudFront → ALB → ECS (API) × N
                 → ECS (VTO GPU) × M
                 → Lambda (intercept)
DynamoDB + ElastiCache + S3 + SQS + Kinesis
```

## Verdict

Core API is horizontally scalable today. Auth and VTO are the primary blockers for multi-instance production deploy.
