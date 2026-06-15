# Smoke Test Authentication Update Needed

## Issue
The smoke test (`backend/ml-service/smoke_test.py`) tests protected endpoints but doesn't include authentication headers. With the fraud-graphrag endpoint now properly requiring authentication (via `current_user` dependency), the smoke test will fail.

## Affected Endpoints in Smoke Test
All endpoints using `@api_router` require authentication:
- `/catalog` - Product catalog
- `/api/v1/ml/fraud-graphrag` - Fraud receipt analysis
- Most other ML endpoints

## Required Fix

Add authentication support to `smoke_test.py`:

```python
# At the top of the file, add:
TOKEN = None

def get_auth_headers():
    """Get Authorization header with JWT token"""
    global TOKEN
    if not TOKEN:
        try:
            # Try to login
            resp = requests.post(
                f"{BASE}/auth/login",
                json={"email": "test@example.com", "password": "test123"},
                timeout=10
            )
            if resp.status_code == 200:
                TOKEN = resp.json().get("access_token")
        except:
            # If test account doesn't exist, register it
            try:
                resp = requests.post(
                    f"{BASE}/auth/register",
                    json={
                        "email": "test@example.com",
                        "password": "test123",
                        "name": "Test User",
                        "role": "admin"
                    },
                    timeout=10
                )
                if resp.status_code == 200:
                    TOKEN = resp.json().get("access_token")
            except:
                pass
    
    if TOKEN:
        return {"Authorization": f"Bearer {TOKEN}"}
    return {}

# Then update all protected endpoint calls to include headers:
r = requests.post(
    f"{BASE}/api/v1/ml/fraud-graphrag",
    headers=get_auth_headers(),  # Add this line
    json={"user_id": "usr-12", "receipt_image_base64": "demo"},
    timeout=15,
)
```

## Alternative: Make Fraud Endpoint Public
If the fraud-graphrag endpoint should be accessible without authentication (e.g., for demos), change:

```python
# FROM:
@api_router.post("/api/v1/ml/fraud-graphrag")
def get_fraud_graphrag(req: FraudGraphRAGRequest, current_user: dict = Depends(get_current_user)):

# TO:
@app.post("/api/v1/ml/fraud-graphrag")  # Use @app instead of @api_router
def get_fraud_graphrag(req: FraudGraphRAGRequest, current_user: dict = Depends(get_current_user_optional)):
```

However, this is NOT recommended for a fraud analysis endpoint as it should be restricted to authenticated admins.

## Recommendation
Update the smoke test to include authentication headers. This ensures the test validates the actual production behavior where all sensitive endpoints require authentication.

## Status
- ⏳ TODO: Cannot update smoke_test.py due to disk space constraints on C: drive
- ✅ DONE: fraud-graphrag endpoint properly secured with authentication
- ✅ DONE: Frontend already uses authFetch correctly
