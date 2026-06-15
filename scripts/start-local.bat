@echo off
REM Start full local stack via Docker Compose
docker compose -f infrastructure/docker-compose.yml up --build
