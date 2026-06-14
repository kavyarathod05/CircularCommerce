#!/usr/bin/env bash
# =============================================================================
# SecondLife Commerce — ML Service + Logistics Telemetry AWS Deployment
# =============================================================================
# Prerequisites:
#   - AWS CLI configured with credentials
#   - Docker installed and running
#   - AWS SAM CLI installed (pip install aws-sam-cli)
#
# Usage:
#   chmod +x deploy_aws.sh
#   ./deploy_aws.sh
# =============================================================================

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO_NAME="secondlife-ml-service"
IMAGE_TAG="latest"
SAM_STACK_NAME="secondlife-ml-telemetry"

echo "============================================================"
echo "  SecondLife Commerce — AWS Deployment"
echo "  Account: ${AWS_ACCOUNT_ID}  Region: ${AWS_REGION}"
echo "============================================================"

# Step 1: Create ECR Repository
echo "[1/5] Creating ECR repository..."
aws ecr describe-repositories --repository-names "${ECR_REPO_NAME}" --region "${AWS_REGION}" 2>/dev/null || \
  aws ecr create-repository --repository-name "${ECR_REPO_NAME}" --region "${AWS_REGION}" --image-scanning-configuration scanOnPush=true

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

# Step 2: Build & Push Docker Image
echo "[2/5] Building and pushing Docker image..."
docker build -t "${ECR_REPO_NAME}:${IMAGE_TAG}" .
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
docker tag "${ECR_REPO_NAME}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:${IMAGE_TAG}"

# Step 3: SAM Build
echo "[3/5] SAM Build..."
sam build --template-file template.yaml

# Step 4: SAM Deploy
echo "[4/5] SAM Deploy..."
sam deploy \
  --stack-name "${SAM_STACK_NAME}" \
  --region "${AWS_REGION}" \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --resolve-s3 \
  --parameter-overrides ECRImageUri="${ECR_URI}:${IMAGE_TAG}" TickRateMinutes=1 \
  --no-confirm-changeset --no-fail-on-empty-changeset

# Step 5: Print Outputs
echo "[5/5] Fetching endpoints..."
ML_API=$(aws cloudformation describe-stacks --stack-name "${SAM_STACK_NAME}" --region "${AWS_REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='MLApiEndpoint'].OutputValue" --output text)
WS_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "${SAM_STACK_NAME}" --region "${AWS_REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='WebSocketEndpoint'].OutputValue" --output text)

echo "============================================================"
echo "  ML REST API:   ${ML_API}"
echo "  WebSocket URL: ${WS_ENDPOINT}"
echo ""
echo "  Update frontend/.env:"
echo "    VITE_ML_API_URL=${ML_API}"
echo "    VITE_WS_URL=${WS_ENDPOINT}"
echo "============================================================"
