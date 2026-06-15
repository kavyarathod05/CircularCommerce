# Testing

## Structure

```
tests/
├── unit/           # Pure logic tests (engines, metrics)
├── integration/    # API + DynamoDB integration
├── e2e/            # Full stack browser/API flows
└── performance/    # Load and latency benchmarks
```

## Running Tests

### Backend integration
```bash
cd backend/ml-service
pip install -r requirements.txt
python test_all_apis.py
python smoke_test.py
```

### Go serverless
```bash
cd backend/serverless-api
go test ./...
```

### Root integration suite
```bash
python tests/integration/test_all_components.py
```

### Frontend
```bash
cd frontend
npm run lint
npm run build
```

## Coverage Targets

| Area | Priority | Current |
|------|----------|---------|
| Auth JWT flow | P0 | smoke_test.py |
| Catalog + listings | P0 | test_all_apis.py |
| ML friction/triage | P0 | test_all_apis.py |
| VTO pipeline | P1 | test_kolors_integration.py |
| Go return intercept | P0 | main_test.go |

## CI Recommendations

1. Lint Python (ruff) + TypeScript (eslint) on PR
2. `go test` + `pytest` on PR
3. `npm run build` to catch type errors
4. Optional: LocalStack for DynamoDB integration tests

## Writing New Tests

- Place engine unit tests in `tests/unit/test_<engine>.py`
- Mock AWS with `moto` or interface injection
- Never call live Gemini/HF APIs in CI — mock responses
- E2E tests should use demo credentials from `.env.example`

## Performance Tests

`tests/performance/` — add locust or k6 scripts for:

- `/catalog` cached vs uncached
- `/api/vto/generate` p95 latency
- Concurrent `/api/v1/ml/friction/evaluate`
