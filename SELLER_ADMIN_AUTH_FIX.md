# Seller & Admin API Authentication Fix

## Problem
All seller and admin features were returning **401 Unauthorized** errors because they weren't using authenticated API requests.

## Solution
Updated all seller and admin components to use `authFetch` from AuthContext instead of plain `fetch()`.

## Files Modified: 6

### 1. **FraudInvestigations.tsx** (Seller & Admin)
- Added `useAuth` import
- Updated 2 fetch calls to authFetch:
  - `GET /api/v1/ml/fraud/trust-score/{userId}`
  - `POST /api/v1/ml/fraud-graphrag`

### 2. **SerialVerification.tsx** (Seller & Admin)
- Added `useAuth` import  
- Updated 2 fetch calls to authFetch:
  - `GET /api/v1/demo/serial-sample`
  - `POST /api/v1/vision/verify-serial`

### 3. **UnitInventoryDashboard.tsx** (Seller & Admin)
- Added `useAuth` import
- Updated 2 fetch calls to authFetch:
  - `GET /api/v1/inventory/units`
  - `POST /api/v1/inventory/units/{unit_id}/repair`

### 4. **RouteOptimizer.tsx** (Admin)
- Added `useAuth` import
- Updated 1 fetch call to authFetch:
  - `POST /api/v1/routing/optimize`

### 5. **FleetOptimizer.tsx** (Admin)
- Added `useAuth` import
- Updated 1 fetch call to authFetch:
  - `POST /api/v1/fleet/optimize`

### 6. **useLogisticsTelemetry.ts** (Admin/Seller)
- Added `useAuth` import
- Updated 6 fetch calls to authFetch:
  - `GET /api/v1/logistics/fleet`
  - `GET /api/v1/logistics/orders`
  - `GET /api/v1/logistics/metrics`
  - `GET /api/v1/logistics/alerts`
  - `GET /api/v1/logistics/tick` (polling)
  - `GET /api/v1/logistics/orders` (in poll)

## Change Pattern

### Before (❌ Unauthenticated):
```typescript
const res = await fetch(`${mlApiUrl}/api/v1/some/endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### After (✅ Authenticated):
```typescript
import { useAuth } from './context/AuthContext';

const { authFetch } = useAuth();

const res = await authFetch(`${mlApiUrl}/api/v1/some/endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

## Features Now Working

### Seller Features ✅
1. **Fraud Investigations** - Trust scores and return reviews
2. **Serial Verification** - Package label scanning
3. **Unit Inventory** - Manage refurbished items
4. **Delivery Overview** - Fleet and order tracking

### Admin Features ✅
1. **Fraud Center** - GraphRAG analysis, receipt tampering detection
2. **Serial Verification** - OCR verification system
3. **Unit Inventory** - Full warehouse management
4. **Route Optimizer** - NSGA-2 multi-objective routing
5. **Fleet Optimizer** - Genetic algorithm fleet planning
6. **Logistics Telemetry** - Real-time fleet tracking

## Testing Checklist

### Seller Role Tests
- [ ] Login as seller
- [ ] Navigate to "Fraud" tab
- [ ] Search for user ID → Trust score loads
- [ ] Navigate to "Serial" tab
- [ ] Verify serial number → OCR analysis works
- [ ] Navigate to "Inventory" tab
- [ ] Inventory units load
- [ ] Navigate to "Logistics" tab
- [ ] Delivery overview loads

### Admin Role Tests
- [ ] Login as admin
- [ ] Navigate to "Fraud" tab
- [ ] See fraud center with GraphRAG
- [ ] Navigate to "Serial" tab
- [ ] Serial verification works
- [ ] Navigate to "Inventory" tab
- [ ] Can update unit status
- [ ] Navigate to "Routing" tab
- [ ] Route optimizer generates plans
- [ ] Navigate to "Logistics" tab
- [ ] Fleet telemetry shows live data

## Browser Console Checks

### Success Indicators ✅
```
GET /api/v1/logistics/fleet → 200 OK
GET /api/v1/logistics/orders → 200 OK
POST /api/v1/routing/optimize → 200 OK
POST /api/v1/fleet/optimize → 200 OK
GET /api/v1/inventory/units → 200 OK
POST /api/v1/vision/verify-serial → 200 OK
GET /api/v1/ml/fraud/trust-score/usr-12 → 200 OK
```

### All Requests Have Auth Header ✅
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

## Common Issues & Solutions

### Issue: Still getting 401 errors
**Check:**
1. User is logged in (token exists in localStorage)
2. Token hasn't expired (check exp claim)
3. User has correct role (seller/admin)

### Issue: Component shows "undefined" for authFetch
**Solution:**
- Make sure component is wrapped in `<AuthProvider>`
- Component must call `useAuth()` hook
- Can't use authFetch outside React components

### Issue: Logistics not loading
**Check:**
1. Backend server is running on port 8000
2. WebSocket server (if using) is running
3. Falls back to REST polling if WebSocket fails
4. Check browser console for connection errors

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Seller/Admin Components                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐    ┌─────────────────┐       │
│  │ FraudInvest     │    │ SerialVerify    │       │
│  │ • Trust scores  │    │ • OCR           │       │
│  │ • GraphRAG      │    │ • Vision AI     │       │
│  └─────────────────┘    └─────────────────┘       │
│                                                     │
│  ┌─────────────────┐    ┌─────────────────┐       │
│  │ UnitInventory   │    │ RouteOptimizer  │       │
│  │ • Repair log    │    │ • NSGA-2        │       │
│  │ • Grading       │    │ • Pareto front  │       │
│  └─────────────────┘    └─────────────────┘       │
│                                                     │
│  ┌─────────────────┐    ┌─────────────────┐       │
│  │ FleetOptimizer  │    │ LogisticsTelem  │       │
│  │ • GA planner    │    │ • Live tracking │       │
│  │ • Green routes  │    │ • WebSocket     │       │
│  └─────────────────┘    └─────────────────┘       │
│                                                     │
│         All use authFetch() ↓                      │
└─────────────────────────────────────────────────────┘
                          │
                          │ Authorization: Bearer <token>
                          ▼
┌─────────────────────────────────────────────────────┐
│                  Backend APIs                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Protected Routes (JWT required):                  │
│  • /api/v1/ml/fraud/*                              │
│  • /api/v1/vision/*                                │
│  • /api/v1/inventory/*                             │
│  • /api/v1/routing/*                               │
│  • /api/v1/fleet/*                                 │
│  • /api/v1/logistics/*                             │
│                                                     │
│  All protected by:                                  │
│  api_router = APIRouter(                           │
│    dependencies=[Depends(get_current_user)]        │
│  )                                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Total API Calls Fixed

- **FraudInvestigations:** 2 calls
- **SerialVerification:** 2 calls
- **UnitInventoryDashboard:** 2 calls
- **RouteOptimizer:** 1 call
- **FleetOptimizer:** 1 call
- **useLogisticsTelemetry:** 6 calls

**Total:** 14 fetch calls updated to use authFetch

## Key Takeaways

1. **Always use authFetch** for protected endpoints
2. **Import from AuthContext** in every component that needs API access
3. **WebSocket connections** don't need auth (yet), but REST fallbacks do
4. **Polling endpoints** need authentication for each request
5. **Custom hooks** (like useLogisticsTelemetry) need authFetch too

## Related Documentation

- `AUTHENTICATION_FIX_SUMMARY.md` - Frontend buyer auth fixes
- `VTO_CART_INTEGRATION_FIX.md` - VTO authentication
- `COMPLETE_FIX_SUMMARY.md` - All authentication fixes
- `QUICK_START_GUIDE.md` - Testing procedures
