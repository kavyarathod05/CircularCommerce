# Deployment

## Local Development

```bash
# Option A: Docker Compose (recommended)
docker compose -f infrastructure/docker-compose.yml up --build

# Option B: Manual
./run_backend.bat    # Windows
./run_frontend.bat
```

Backend: `http://localhost:8000`  
Frontend: `http://localhost:5173`  
WebSocket telemetry: `http://localhost:8765`

## Environment Setup

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
# Add GEMINI_API_KEY for full AI features
```

Seed DynamoDB (requires AWS credentials):
```bash
python database/seeds/setup_aws.py
python database/seeds/seed_dynamodb.py
```

## AWS Deployment

### ML API (Container Lambda / ECS)

```bash
cd backend/ml-service
docker build -t secondlife-backend .
# Push to ECR — see buildspec.yml
```

`buildspec.yml` automates ECR push via CodeBuild.

### Return Intercept (SAM)

```bash
cd backend/serverless-api
sam build
sam deploy --guided
```

Resources: DynamoDB tables, S3 uploads bucket, Location Service, API Gateway, Go Lambda.

### Frontend

Build static assets:
```bash
cd frontend && npm run build
# Deploy dist/ to S3 + CloudFront
```

## Infrastructure Files

| File | Purpose |
|------|---------|
| `infrastructure/docker-compose.yml` | Local full stack |
| `backend/ml-service/template.yaml` | SAM ML + WebSocket |
| `backend/serverless-api/template.yaml` | SAM return intercept |
| `buildspec.yml` | CodeBuild ECR pipeline |
| `userdata.sh` | EC2 bootstrap (if used) |

## Health Checks

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"healthy","gemini_configured":true|false,...}`

## Rollback

- Lambda: alias traffic shift to previous version
- ECS: revert task definition revision
- DynamoDB: point-in-time recovery (enable on production tables)
