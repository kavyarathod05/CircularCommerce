# Sustainability Impact

## Mission

Intercept returns **before** they enter long-haul reverse logistics by matching returned items with local buyers, locker drop-offs, or refurbishment paths.

## Measurable Metrics

| Metric | Source | Calculation |
|--------|--------|-------------|
| CO₂ saved (kg) | `CarbonMetrics` table, seller metrics | `warehouse_returns × 2.4kg − hyperlocal × 0.35kg` |
| Distance avoided (km) | Return intercept Go Lambda | Warehouse round-trip − hyperlocal last-mile |
| Warehouse transfers avoided | Seller metrics | `hyperlocal_returns / total_returns × 100` |
| Trees equivalent | Seller/user metrics | `co2_saved_kg / 21.2` |
| Green credits issued | Negotiation endpoint | Partial-refund incentive credits |

## Return Pathway Carbon Model

| Pathway | Est. CO₂ per return | Notes |
|---------|---------------------|-------|
| Centralized warehouse | **2.4 kg** | Long-haul + sort center |
| Hyperlocal P2P | **0.35 kg** | Last-mile only |
| Locker drop-off | **0.45 kg** | Short hub route |
| Refurbish local | **0.8 kg** | Repair + re-list |

Constants defined in `metrics_service.py` and Go `handleReturnIntercept`.

## Fleet Optimization Impact

`fleet_optimizer.py` and `nsga2_routing.py` optimize for:

- **Cost weight** (default 0.6)
- **Emission weight** (default 0.4)

Pareto fronts show trade-offs between rupee cost and kg CO₂ per route.

## Dashboard Surfaces

- **Buyer Account**: personal CO₂ saved, green credits
- **Seller Dashboard**: warehouse avoidance rate, capital recovery
- **Admin Workspace**: fleet telemetry, route optimizer emissions

## Validation

Impact numbers are **derived from pathway selection and DynamoDB carbon records**, not hardcoded UI constants. Frontend fallbacks display only when API is unreachable.

## Future Improvements

1. Integrate Amazon Location Service actual route distances (partially in Go Lambda)
2. Scope-3 emission factors per product category (electronics vs apparel)
3. Third-party carbon audit API for hackathon demo verification
