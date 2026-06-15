# Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Default JWT secret in prod | Low (guard added) | Critical | `APP_ENV=production` check |
| DynamoDB table mismatch | Medium | High | Run both seed scripts; unify schema |
| Gemini API outage | Medium | Medium | Rule-based disposition fallback |
| VTO latency on CPU | High | Medium | Queue + GPU service |
| Demo creds in prod | Low | High | Disable seed when `APP_ENV=production` |
| CORS wildcard | Medium | Medium | Restrict origins in prod |
| In-memory auth loss on restart | High | Medium | Migrate to Cognito |
| Missing ML model files | Medium | Low | Heuristic fallbacks active |
| S3 presign failure | Low | Low | Frontend blob URL fallback |
| Kafka/Redis not running locally | Medium | Low | Graceful cache miss |

## Security Risks

- **Receipt upload storage**: Saved to `static/` — add TTL cleanup job
- **No rate limiting**: Vulnerable to abuse on public deploy
- **GraphRAG demo receipt**: UI sends `demo` string — backend handles gracefully

## Operational Risks

- Single `main.py` monolith — blast radius on deploy
- No automated rollback beyond Lambda aliases
- WebSocket server separate process — easy to forget in deploy

## Recommended Mitigations (Priority Order)

1. Cognito + API Gateway authorizer
2. WAF + rate limits
3. DynamoDB schema unification via single SAM stack
4. S3 lifecycle for uploaded receipts
5. Health-check based auto-restart in ECS
