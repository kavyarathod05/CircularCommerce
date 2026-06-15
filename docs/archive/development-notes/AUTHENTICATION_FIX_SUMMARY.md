# Authentication Fix Summary

## Problem
All API calls from the frontend were returning **401 Unauthorized** errors because they weren't including the JWT token in the Authorization header.

## Root Cause
The frontend had an `authFetch` helper function in `AuthContext.tsx` that properly adds the `Authorization: Bearer <token>` header, but the API calls in `App.tsx` were using plain `fetch()` instead of `authFetch`.

## Solution Applied

### Frontend Changes (App.tsx)
Updated all API calls to use `authFetch` instead of plain `fetch()`:

1. **Added authFetch to destructured values:**
   ```typescript
   const { user, isAuthenticated, isLoading, logout, authFetch } = useAuth();
   ```

2. **Updated all fetch calls** (8 locations):
   - Catalog loading
   - Seller metrics
   - User metrics
   - DPP data
   - Friction evaluation
   - ML inspection API
   - Triage API
   - GS1 certificate
   - Listing updates

3. **Added authFetch to useEffect dependencies** to prevent stale closures

### How authFetch Works

The `authFetch` function from `AuthContext.tsx`:
```typescript
const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }
  return fetch(url, { ...options, headers });
}, []);
```

It automatically:
- Retrieves the JWT token from localStorage
- Adds the `Authorization: Bearer <token>` header to every request
- Preserves any other headers passed in
- Returns a standard fetch Response

## Backend Configuration

The backend (`main.py`) is correctly configured with:

### Public Endpoints (no auth required):
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login to existing account
- `GET /health` - Health check

### Protected Endpoints (auth required):
All other endpoints are protected by the `api_router` which has:
```python
api_router = APIRouter(dependencies=[Depends(get_current_user)])
```

This includes:
- `/catalog` - Product listings
- `/api/v1/ml/*` - All ML service endpoints
- `/api/vto/*` - Virtual try-on endpoints
- `/seller/metrics` - Seller dashboard data
- `/user/metrics` - User profile data
- All other business logic endpoints

## Authentication Flow

1. **User Login:**
   - Frontend sends credentials to `/auth/login`
   - Backend validates and returns JWT token
   - Frontend stores token in localStorage

2. **Authenticated Requests:**
   - Frontend uses `authFetch` for all API calls
   - Token is automatically added to Authorization header
   - Backend validates token via `get_current_user` dependency
   - Request proceeds if token is valid

3. **Token Expiration:**
   - Frontend checks token expiration on page load
   - Expired tokens are automatically cleared
   - User is redirected to login page

## Testing

To verify the fix is working:

1. **Start the backend:**
   ```bash
   cd backend\ml-service
   uvicorn main:app --reload --port 8000
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the flow:**
   - Register a new account or login
   - Navigate to different tabs (Catalog, VTO, Prevention, etc.)
   - All API calls should now succeed with proper authentication

4. **Check browser console:**
   - No more 401 Unauthorized errors
   - API responses should show `{"status": "success", ...}`

## Security Notes

- JWT tokens are stored in localStorage (client-side)
- Tokens have expiration timestamps (`exp` claim)
- Backend validates tokens on every protected endpoint
- CORS is configured to allow cross-origin requests during development

## Files Modified

1. `frontend/src/App.tsx` - Updated all fetch calls to use authFetch
2. `frontend/src/context/AuthContext.tsx` - (No changes, already correct)
3. `backend/ml-service/main.py` - (No changes, already correct)

## Additional Notes

- All view components (`views/*.tsx`) don't make direct API calls - they use state from App.tsx
- The AuthContext provides the `authFetch` function to all child components
- No component files needed updates besides App.tsx
