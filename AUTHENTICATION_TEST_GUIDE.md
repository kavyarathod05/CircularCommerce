# Authentication Testing Guide

## Quick Start

### 1. Start Backend Server
```bash
cd backend\ml-service
uvicorn main:app --reload --port 8000
```

Wait for: `Application startup complete.`

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

Open: http://localhost:5173 (or the URL shown in terminal)

## Test Scenarios

### Test 1: Login Flow
1. Open the app - you should see the Login page
2. **Register a new account:**
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`
   - Role: `buyer`
3. Click "Register" - you should be logged in automatically
4. **Check browser console** - no 401 errors should appear

### Test 2: Catalog API (Buyer Role)
1. Login as a buyer
2. Navigate to "Catalog" tab
3. **Expected:** Product listings load successfully
4. **Browser Console:** Check for:
   ```
   GET http://127.0.0.1:8000/catalog → 200 OK
   ```
5. **Browser DevTools Network tab:** 
   - Click on the `/catalog` request
   - Check "Request Headers" section
   - Should see: `Authorization: Bearer eyJ...` (JWT token)

### Test 3: Virtual Try-On API
1. Stay logged in as buyer
2. Navigate to "VTO" tab
3. Click "Try" on any product
4. **Expected:** VTO interface loads successfully
5. **Browser Console:** Check for:
   ```
   GET http://127.0.0.1:8000/api/products/... → 200 OK
   ```

### Test 4: Prevention Tab (Friction API)
1. Stay logged in as buyer
2. Navigate to "Prevention" tab
3. **Expected:** Cart items and friction score display
4. **Browser Console:** Check for:
   ```
   POST http://127.0.0.1:8000/api/v1/ml/friction/evaluate → 200 OK
   ```

### Test 5: Return Wizard Flow
1. Stay logged in as buyer
2. Navigate to "Wizard" tab
3. Fill in the form and click "Submit Return"
4. **Expected:** Multiple API calls succeed:
   ```
   POST .../api/v1/ml/aws/inspect-condition → 200 OK
   POST .../api/v1/ml/triage → 200 OK
   GET .../api/v1/gs1/certificate → 200 OK
   ```

### Test 6: Seller Dashboard
1. **Logout** from buyer account
2. **Register new account:**
   - Email: `seller@example.com`
   - Password: `password123`
   - Name: `Seller User`
   - Role: `seller`
3. Navigate to "Admin" tab (seller dashboard)
4. **Expected:** Seller metrics and listings load
5. **Browser Console:** Check for:
   ```
   GET .../seller/metrics → 200 OK
   GET .../catalog → 200 OK
   ```

### Test 7: Token Persistence
1. Login to any account
2. Refresh the page (F5)
3. **Expected:** You stay logged in (token persists in localStorage)
4. **Expected:** All tabs still work without re-login

### Test 8: Token Expiration
1. Login to any account
2. Open Browser DevTools → Application tab → Local Storage
3. Find key: `secondlife_jwt`
4. Delete the token
5. Refresh the page
6. **Expected:** Redirected to login page

## Debugging 401 Errors

If you still see 401 errors, check:

### 1. Check Token is Being Sent
Open Browser DevTools → Network tab
- Click on any failing request
- Check "Request Headers" section
- Look for: `Authorization: Bearer <token>`
- If missing, the component is using `fetch()` instead of `authFetch()`

### 2. Check Token is Valid
Open Browser Console and run:
```javascript
localStorage.getItem('secondlife_jwt')
```
- Should return a long JWT string starting with `eyJ`
- If `null`, you're not logged in

### 3. Check Backend Logs
Look at the backend terminal for:
```
INFO:     127.0.0.1:xxxxx - "GET /catalog HTTP/1.1" 401 Unauthorized
```
- If you see 401, the token might be expired or invalid

### 4. Manual Token Decode (Browser Console)
```javascript
const token = localStorage.getItem('secondlife_jwt');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
console.log('Expires:', new Date(payload.exp * 1000));
```
- Check if `exp` (expiration) is in the past

## Common Issues

### Issue: All APIs return 401
**Solution:** Make sure all fetch calls use `authFetch` instead of plain `fetch()`

### Issue: 401 only on specific endpoints
**Solution:** Check if that component is using the `authFetch` function from context

### Issue: Login works but APIs still fail
**Solution:** 
1. Check if token is stored: `localStorage.getItem('secondlife_jwt')`
2. If not stored, check the `/auth/login` response
3. Backend should return `{ "access_token": "...", "user": {...} }`

### Issue: Token not included in headers
**Solution:** 
1. Component must use `authFetch` from `useAuth()` hook
2. Make sure component is inside `<AuthProvider>` wrapper
3. Check that `authFetch` is called, not `fetch()`

## Success Indicators

✅ **Login page** → Login/Register → **Redirected to main app**  
✅ **Browser console** → No 401 errors  
✅ **Network tab** → All requests have `Authorization: Bearer ...` header  
✅ **All tabs load data** → Catalog, VTO, Prevention, Seller Dashboard, etc.  
✅ **Page refresh** → Stay logged in (token persists)  

## Additional Tools

### View Current User (Browser Console)
```javascript
const token = localStorage.getItem('secondlife_jwt');
const payload = JSON.parse(atob(token.split('.')[1]));
console.table({
  email: payload.email,
  name: payload.name,
  role: payload.role,
  expires: new Date(payload.exp * 1000).toLocaleString()
});
```

### Test Health Endpoint (No Auth)
```bash
curl http://127.0.0.1:8000/health
```
Expected: `{"status":"ML Microservice is ALIVE"}`

### Test Protected Endpoint (With Auth)
```bash
# Replace <TOKEN> with actual JWT from localStorage
curl -H "Authorization: Bearer <TOKEN>" http://127.0.0.1:8000/catalog
```
Expected: JSON array of products

### Test Protected Endpoint (Without Auth) - Should Fail
```bash
curl http://127.0.0.1:8000/catalog
```
Expected: `{"detail":"Not authenticated"}` with 401 status
