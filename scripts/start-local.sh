#!/usr/bin/env bash
set -euo pipefail
docker compose -f infrastructure/docker-compose.yml up --build
