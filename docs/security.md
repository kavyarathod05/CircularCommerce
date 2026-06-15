# Security

## Authentication

- **JWT (HS256)** with configurable `JWT_SECRET`
- Production startup **fails** if default secret is used (`APP_ENV=production`)
- Demo accounts seeded only for `APP_ENV=development`
- Role-based access: `buyer`, `seller`, `admin` via `require_role()` dependency

## Secrets Management

| Secret | Storage | Required |
|--------|---------|----------|
| JWT_SECRET | `.env` / AWS Secrets Manager | Production |
| GEMINI_API_KEY | `.env` / Secrets Manager | AI features |
| GS1_API_KEY | `.env` | Live GTIN verification |
| HF_API_KEY | `.env` | Serial OCR |
| AWS credentials | IAM roles (prod) / `.env` (dev) | DynamoDB, S3, Rekognition |

Copy `.env.example` to `.env` — **never commit `.env`**.

## API Security

- All business routes require JWT (`api_router` dependency)
- CORS: `*` in development; restrict to app domain in production
- Input validation via Pydantic models on all POST bodies
- File uploads validated for non-empty content on VTO endpoints
- `503` returned when AI keys missing (no silent fake responses for video inspect)

## Session Management

- Stateless JWT, 72-hour expiry
- No server-side session store
- Token in `Authorization: Bearer` header only

## Dependency Security

```bash
pip audit                    # Python
npm audit --prefix frontend  # Node
```

Run in CI before deploy. Pin versions in `requirements.txt` and `package-lock.json`.

## Fraud & Abuse

- Graph-based trust scoring (`network_fraud.py`)
- Device fingerprinting via linked-account graph
- Receipt tampering probability from trust score + optional image upload
- Rate limiting: **recommended** at API Gateway (not yet in local dev)

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Set `APP_ENV=production`
- [ ] Remove or disable demo user seeding
- [ ] Enable API Gateway throttling + WAF
- [ ] Use IAM roles, not access keys on EC2/Lambda
- [ ] Enable DynamoDB encryption at rest (default on AWS)
- [ ] Restrict CORS to production domain
- [ ] Enable CloudTrail + GuardDuty

## Reporting Vulnerabilities

Email security concerns to the repository maintainers. Do not open public issues for undisclosed vulnerabilities.
