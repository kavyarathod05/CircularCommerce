# Code Changes Summary - Authentication Fix

## Files Modified: 1
- `frontend/src/App.tsx`

## Total Changes: 9 locations

### Change 1: Import authFetch from useAuth hook

**Location:** Line ~69  
**Before:**
```typescript
const { user, isAuthenticated, isLoading, logout } = useAuth();
```

**After:**
```typescript
const { user, isAuthenticated, isLoading, logout, authFetch } = useAuth();
```

---

### Change 2-5: Catalog and Metrics API Calls

**Location:** `useEffect` hook (~line 100-135)  
**Changed 4 fetch calls to authFetch:**

1. **Catalog loading:**
```typescript
// Before: fetch(`${mlApiUrl}/catalog`)
// After:
authFetch(`${mlApiUrl}/catalog`)
```

2. **Seller metrics:**
```typescript
// Before: fetch(`${mlApiUrl}/seller/metrics?seller_id=usr-12`)
// After:
authFetch(`${mlApiUrl}/seller/metrics?seller_id=usr-12`)
```

3. **Seller catalog:**
```typescript
// Before: fetch(`${mlApiUrl}/catalog`)
// After:
authFetch(`${mlApiUrl}/catalog`)
```

4. **User metrics:**
```typescript
// Before: fetch(`${mlApiUrl}/user/metrics?user_id=usr-12`)
// After:
authFetch(`${mlApiUrl}/user/metrics?user_id=usr-12`)
```

5. **DPP data:**
```typescript
// Before: fetch(`${mlApiUrl}/dpp?listing_id=lst-123`)
// After:
authFetch(`${mlApiUrl}/dpp?listing_id=lst-123`)
```

**Also updated dependency array:**
```typescript
// Before: }, [activeTab, userRole])
// After:
}, [activeTab, userRole, authFetch])
```

---

### Change 6: Friction Evaluation API

**Location:** `evaluateFriction` function (~line 180)  
**Before:**
```typescript
const resp = await fetch(`${mlApiUrl}/api/v1/ml/friction/evaluate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
})
```

**After:**
```typescript
const resp = await authFetch(`${mlApiUrl}/api/v1/ml/friction/evaluate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
})
```

---

### Change 7: ML Inspection API (Video/Image)

**Location:** `runTriageSimulation` function (~line 275)  
**Before:**
```typescript
const mlResp = await fetch(`${mlBaseUrl}${endpoint}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reqBody)
})
```

**After:**
```typescript
const mlResp = await authFetch(`${mlBaseUrl}${endpoint}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reqBody)
})
```

---

### Change 8: Triage API

**Location:** `runTriageSimulation` function (~line 310)  
**Before:**
```typescript
const triageResp = await fetch(`${mlBaseUrl}/api/v1/ml/triage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
})
```

**After:**
```typescript
const triageResp = await authFetch(`${mlBaseUrl}/api/v1/ml/triage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
})
```

---

### Change 9: GS1 Certificate API

**Location:** `runTriageSimulation` function (~line 355)  
**Before:**
```typescript
const gs1Resp = await fetch(`${mlBaseUrl}/api/v1/gs1/certificate?product_id=${encodeURIComponent(productId)}`)
```

**After:**
```typescript
const gs1Resp = await authFetch(`${mlBaseUrl}/api/v1/gs1/certificate?product_id=${encodeURIComponent(productId)}`)
```

---

### Change 10: Listing Update API

**Location:** `toggleListingStatus` function (~line 420)  
**Before:**
```typescript
await fetch(`${mlApiUrl}/listing`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
})
```

**After:**
```typescript
await authFetch(`${mlApiUrl}/listing`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
})
```

---

## Pattern Applied

**Every change follows this pattern:**

```typescript
// ❌ OLD (Unauthorized):
fetch(url, options)

// ✅ NEW (Authenticated):
authFetch(url, options)
```

The `authFetch` function automatically adds the `Authorization: Bearer <token>` header to every request.

## Why This Works

1. **authFetch is provided by AuthContext:** It has access to the JWT token stored in localStorage
2. **Automatic header injection:** It wraps the native `fetch()` and adds the Authorization header
3. **No manual token management:** Components don't need to manually retrieve or pass tokens
4. **Centralized logic:** If token management changes, only AuthContext needs updating

## Testing the Changes

Run this in browser console after login to see the difference:

```javascript
// Without auth (will fail):
fetch('http://127.0.0.1:8000/catalog')
  .then(r => r.json())
  .then(console.log)
// Result: {"detail":"Not authenticated"}

// With auth from localStorage:
const token = localStorage.getItem('secondlife_jwt');
fetch('http://127.0.0.1:8000/catalog', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(console.log)
// Result: [{ listingId: "...", productId: "...", ... }]
```

## Related Files (No Changes Needed)

- `frontend/src/context/AuthContext.tsx` - Already implements authFetch correctly
- `backend/ml-service/main.py` - Already requires authentication correctly
- All view components in `frontend/src/views/` - Don't make direct API calls
- All other components in `frontend/src/components/` - Don't make direct API calls
