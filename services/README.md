# Services Architecture

SecondLife Commerce uses a **modular monolith** API gateway (`backend/ml-service`) with domain modules mapped to logical microservices. Each module can be extracted independently for horizontal scaling.

| Logical Service | Module(s) | Responsibility |
|-----------------|-----------|----------------|
| `auth` | `auth.py` | JWT registration, login, RBAC |
| `catalog` | `catalog_cache.py`, `product_registry.py` | Listings, GS1 certificates |
| `pricing` | `dynamic_pricing.py` | Hyperlocal dynamic pricing |
| `forecasting` | `demand_engine.py` | Local demand ranking |
| `return-risk` | `predictive_friction.py` | Checkout friction / bracketing detection |
| `virtual-tryon` | `vto_orchestrator.py`, `vto_engine.py`, `idm_vton_client.py` | Photo-based garment overlay |
| `return-interception` | `serverless-api/return-intercept/` | Go Lambda return routing + escrow |
| `gs1-verification` | `gs1_verification.py` | GTIN authenticity |
| `escrow` | `main.py` listing transitions | Escrow lock/release state machine |
| `fraud-detection` | `network_fraud.py` | Graph-based trust scoring |
| `package-verification` | `serial_verification.py` | Serial OCR verification |
| `logistics` | `logistics_telemetry.py`, `logistics_ws_server.py` | Fleet telemetry (simulated GPS for demo fleet) |
| `fleet-optimization` | `fleet_optimizer.py`, `nsga2_routing.py` | NSGA-II + GA route planning |
| `sustainability` | `metrics_service.py` | CO₂ and warehouse avoidance metrics |
| `notification` | `ws_lambda_handlers.py` | WebSocket event fan-out |

## Deployment Units

```
apps/commerce-web/          → React SPA (buyer + seller + admin personas)
backend/ml-service/         → FastAPI API gateway (Python)
backend/serverless-api/     → AWS SAM Go Lambda (return intercept)
infrastructure/             → Docker Compose, SAM templates, CodeBuild
database/seeds/             → DynamoDB bootstrap scripts
packages/shared-types/      → Cross-stack TypeScript contracts
```

## Extraction Path

1. Extract `return-intercept` (already separate Go Lambda)
2. Extract `virtual-tryon` to GPU-backed ECS service
3. Extract `fraud-detection` to batch + stream processor
4. Move auth to Cognito + API Gateway authorizer
