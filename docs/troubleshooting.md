# Troubleshooting

## Backend won't start

**`RuntimeError: JWT_SECRET must be set`**
- Set `JWT_SECRET` in `.env` or use `APP_ENV=development`

**`ModuleNotFoundError` for torch/diffusers**
- VTO GPU deps are heavy; video VTO auto-disables on import failure
- Core API runs without VTO: `pip install -r requirements.txt` (may take time)

## Catalog empty

1. Set `USE_DYNAMODB_CATALOG=1`
2. Run `python database/seeds/setup_aws.py`
3. Verify AWS credentials and region `us-east-1`
4. Without DynamoDB, demo catalog from `product_registry.py` is served

## AI features return 503

- Video inspect requires `GEMINI_API_KEY`
- Copy `.env.example` → `backend/ml-service/.env` and add key

## VTO fails / slow

- First run downloads HF models — allow 5–10 minutes
- Check `vto-storage/` directory is writable
- See `backend/ml-service/KOLORS_VTO_README.md` for GPU setup

## Auth 401 on API calls

- Login first; token expires after 72 hours
- Demo: `buyer@demo.com` / `buyer123`
- Ensure `authFetch` sends `Authorization: Bearer` header

## CORS errors on static files

- VTO images served from `/vto-storage/` — CORS middleware handles this
- If blocked, verify backend is on port 8000

## DynamoDB table not found

- Table names vary (`SecondLife_Listings` vs `ListingsTable`)
- Run both seed scripts or align tables per `docs/database.md`

## WebSocket / logistics not updating

- Start `logistics_ws_server.py` on port 8765
- Or set `VITE_WS_URL` to AWS API Gateway WebSocket URL
- Falls back to REST polling `/api/v1/logistics/tick` every 2.5s

## Docker Compose issues

```bash
docker compose -f infrastructure/docker-compose.yml down -v
docker compose -f infrastructure/docker-compose.yml up --build
```

Kafka/Zookeeper optional for core flows; Redis improves catalog cache.
