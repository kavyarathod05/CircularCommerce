# Authentication Flow Diagram

## Before Fix (401 Errors)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (App.tsx)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User clicks "Catalog" tab                                       │
│         │                                                        │
│         ▼                                                        │
│  fetch('http://127.0.0.1:8000/catalog')  ❌ NO TOKEN!          │
│         │                                                        │
│         │  Request Headers:                                      │
│         │  ├─ Content-Type: application/json                     │
│         │  └─ (no Authorization header)                          │
│         │                                                        │
│         ▼                                                        │
└─────────────────────────────────────────────────────────────────┘
          │
          │ HTTP GET /catalog
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (main.py)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  @api_router.get("/catalog")                                     │
│  dependencies=[Depends(get_current_user)]                        │
│         │                                                        │
│         ▼                                                        │
│  get_current_user() checks Authorization header                  │
│         │                                                        │
│         ▼                                                        │
│  ❌ Header not found!                                            │
│         │                                                        │
│         ▼                                                        │
│  Return 401 Unauthorized                                         │
│  {"detail": "Not authenticated"}                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## After Fix (Authenticated)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (App.tsx)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User clicks "Catalog" tab                                       │
│         │                                                        │
│         ▼                                                        │
│  authFetch('http://127.0.0.1:8000/catalog')  ✅ WITH TOKEN!    │
│         │                                                        │
│         ▼                                                        │
│  ┌───────────────────────────────────────────────┐              │
│  │ AuthContext.authFetch()                       │              │
│  │  1. Get token from localStorage               │              │
│  │  2. Add Authorization: Bearer <token>         │              │
│  │  3. Call native fetch()                       │              │
│  └───────────────────────────────────────────────┘              │
│         │                                                        │
│         │  Request Headers:                                      │
│         │  ├─ Content-Type: application/json                     │
│         │  └─ Authorization: Bearer eyJ0eXAiOi...                │
│         │                                                        │
│         ▼                                                        │
└─────────────────────────────────────────────────────────────────┘
          │
          │ HTTP GET /catalog
          │ Authorization: Bearer eyJ0eXAiOi...
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (main.py)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  @api_router.get("/catalog")                                     │
│  dependencies=[Depends(get_current_user)]                        │
│         │                                                        │
│         ▼                                                        │
│  get_current_user() checks Authorization header                  │
│         │                                                        │
│         ▼                                                        │
│  ✅ Token found! Decode and validate                             │
│         │                                                        │
│         ▼                                                        │
│  Extract user info from token:                                   │
│  { email: "user@example.com", role: "buyer", ... }               │
│         │                                                        │
│         ▼                                                        │
│  Return 200 OK with catalog data                                 │
│  [{ listingId: "lst-1", productId: "Headphones", ... }]          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Complete Authentication Lifecycle

```
┌──────────────────────────────────────────────────────────────────────┐
│                     1. USER REGISTRATION / LOGIN                     │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  User enters credentials               │
         │  - Email: user@example.com             │
         │  - Password: ••••••••                  │
         │  - Role: buyer                         │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Frontend: POST /auth/login            │
         │  (no token needed - public endpoint)   │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Backend: Validate credentials         │
         │  Generate JWT token                    │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Response:                             │
         │  {                                     │
         │    access_token: "eyJ0eXAi...",        │
         │    user: {                             │
         │      email: "user@example.com",        │
         │      name: "John Doe",                 │
         │      role: "buyer"                     │
         │    }                                   │
         │  }                                     │
         └────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     2. TOKEN STORAGE                                 │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Frontend: Store in localStorage       │
         │  key: "secondlife_jwt"                 │
         │  value: "eyJ0eXAi..."                  │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Update AuthContext state:             │
         │  - setToken(token)                     │
         │  - setUser(userData)                   │
         │  - isAuthenticated = true              │
         └────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     3. AUTHENTICATED REQUESTS                        │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  User navigates to Catalog tab         │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  App.tsx: authFetch('/catalog')        │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  AuthContext.authFetch():              │
         │  1. token = localStorage.get(...)      │
         │  2. headers.Authorization =            │
         │     "Bearer " + token                  │
         │  3. return fetch(url, { headers })     │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Backend: api_router dependency        │
         │  Depends(get_current_user)             │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  auth.py: get_current_user()           │
         │  1. Extract Authorization header       │
         │  2. Parse "Bearer <token>"             │
         │  3. Decode JWT                         │
         │  4. Validate signature & expiration    │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  ✅ Valid token                         │
         │  Extract user claims:                  │
         │  - email                               │
         │  - role                                │
         │  - permissions                         │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Execute endpoint logic                │
         │  Return 200 OK + data                  │
         └────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     4. TOKEN PERSISTENCE                             │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  User refreshes page (F5)              │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  AuthProvider.useEffect():             │
         │  1. Check localStorage for token       │
         │  2. Decode token payload               │
         │  3. Check expiration (exp claim)       │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  ✅ Token valid & not expired           │
         │  - setUser(decoded data)               │
         │  - setToken(token)                     │
         │  - User stays logged in!               │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Optional: Background refresh          │
         │  Call /auth/me to sync latest data     │
         └────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     5. LOGOUT                                        │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  User clicks Logout button             │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  AuthContext.logout():                 │
         │  1. localStorage.removeItem(token)     │
         │  2. setToken(null)                     │
         │  3. setUser(null)                      │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Redirect to Login page                │
         └────────────────────────────────────────┘
```

## Token Structure (JWT)

```
Header
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload (Claims)
{
  "sub": "user-id-123",           // Subject (user ID)
  "email": "user@example.com",    // User email
  "name": "John Doe",             // User name
  "role": "buyer",                // User role (buyer/seller/admin)
  "iat": 1735189200,              // Issued at timestamp
  "exp": 1735275600               // Expiration timestamp
}

Signature
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  SECRET_KEY
)

Complete Token:
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsIm5hbWUiOiJKb2huIERvZSIsInJvbGUiOiJidXllciIsImlhdCI6MTczNTE4OTIwMCwiZXhwIjoxNzM1Mjc1NjAwfQ.abcdef123456...
```

## Key Takeaways

1. **authFetch automatically adds the token** - No manual header management needed
2. **Token stored in localStorage** - Persists across page refreshes
3. **Backend validates on every request** - Security enforced server-side
4. **Public endpoints** - Login, Register, Health don't need tokens
5. **Protected endpoints** - Everything else requires valid JWT
