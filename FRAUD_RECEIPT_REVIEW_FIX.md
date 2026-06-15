# Fraud Receipt Review Fix

## Summary
Fixed the `/api/v1/ml/fraud-graphrag` endpoint to provide dynamic receipt analysis based on user trust scores instead of returning static demo data.

## Changes Made

### Backend: `main.py` - `/api/v1/ml/fraud-graphrag` endpoint

**Before:**
- Endpoint accepted `FraudGraphRAGRequest` but ignored the actual user data
- Returned hardcoded demo data with static values
- No authentication context (missing `current_user`)
- Always showed high-risk fraud scenario regardless of actual user

**After:**
1. **Added Authentication Context**: 
   ```python
   def get_fraud_graphrag(req: FraudGraphRAGRequest, current_user: dict = Depends(get_current_user))
   ```
   - Now tracks which authenticated user is performing the fraud analysis
   - Consistent with other protected endpoints

2. **Dynamic Trust Score Integration**:
   ```python
   trust_data = fraud_model.evaluate_trust_score(req.user_id)
   trust_score = trust_data.get('final_score', 100)
   is_high_risk = trust_data.get('fraud_flag', False)
   ```
   - Retrieves actual trust score from the SEFraudGNN model
   - Uses trust score to determine fraud risk level

3. **Risk-Based Response Generation**:
   - **High Risk (trust_score < 30)**:
     - Tampering probability: 98%
     - Connected accounts: 40
     - Action: "Hold refund and request in-store receipt verification"
   
   - **Medium Risk (trust_score < 70)**:
     - Tampering probability: 55%
     - Connected accounts: 10
     - Action: "Request additional documentation before processing refund"
   
   - **Low Risk (trust_score >= 70)**:
     - Tampering probability: 15%
     - Connected accounts: 2
     - Action: "Proceed with standard refund verification"

4. **Dynamic Receipt Analysis (ELA regions)**:
   - Shows highlighted suspicious regions only when tampering_prob > 0.3
   - Adjusts severity levels based on risk (high/medium/low)
   - Empty array for clean receipts

5. **Dynamic Network Graph**:
   - Base nodes always show: target user, device, address
   - Additional fraud ring nodes only appear when connected > 20
   - Node risk levels reflect actual fraud flag status
   - Edges adapt to show relevant connections

6. **Improved Summary Text**:
   - Includes actual trust score in summary
   - Mentions number of linked accounts detected
   - Adds "High risk" prefix for flagged users
   - Conditionally mentions receipt edits based on tampering probability

## Impact

### Frontend (`FraudInvestigations.tsx`)
- No changes needed - already using `authFetch` correctly
- Will now receive dynamic data that matches user's actual trust score
- Visual elements (receipt hotspots, network graph) will adapt to risk level

### User Experience
- **Admins** see realistic fraud analysis matching user behavior
- **Low-risk users** show clean receipts with minimal warnings
- **High-risk users** display detailed investigation with flagged areas
- Consistent trust score correlation between trust panel and receipt analysis

## Testing

Test with different user IDs to see varying risk levels:

```bash
# High-risk user (trust score < 30)
curl -X POST http://localhost:8000/api/v1/ml/fraud-graphrag \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "usr-12", "receipt_image_base64": "demo"}'

# Response will show:
# - 98% tampering probability
# - 40 connected accounts
# - High severity ELA regions
# - Full fraud ring network graph
```

## Future Enhancements

1. **Actual Receipt Processing**:
   - Currently uses `receipt_image_base64` parameter but doesn't process it
   - Could integrate computer vision for real tampering detection
   - Error Level Analysis (ELA) for actual image forensics

2. **Live Network Query**:
   - Could query DynamoDB to find actual linked accounts
   - Real-time device fingerprint matching
   - Historical pattern analysis

3. **ML Model Integration**:
   - Train a receipt tampering detection model
   - Use AWS Rekognition for text/image analysis
   - Integrate with Document Fraud Detection services

## Files Modified
- `backend/ml-service/main.py` - Updated fraud-graphrag endpoint with authentication and dynamic analysis

## Related Documentation
- `AUTHENTICATION_FIX_SUMMARY.md` - Authentication pattern followed
- `backend/ml-service/network_fraud.py` - SEFraudGNN model used for trust scores
