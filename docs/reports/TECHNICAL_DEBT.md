# Technical Debt Report

| ID | Item | Priority | Effort | Status |
|----|------|----------|--------|--------|
| TD-01 | Unify DynamoDB table naming | P0 | 2d | Documented |
| TD-02 | Migrate auth to Cognito | P0 | 3d | Open |
| TD-03 | Persist unit inventory to DynamoDB | P1 | 1d | Open |
| TD-04 | Wire ProcessingLogsView to CloudWatch/API | P2 | 1d | Open |
| TD-05 | Train & commit ML artifacts to S3 | P1 | 1d | Open |
| TD-06 | Move frontend → apps/commerce-web | P2 | 2h | Blocked (file lock) |
| TD-07 | API Gateway rate limiting | P1 | 4h | Open |
| TD-08 | Consolidate Go + Python listing APIs | P1 | 2d | Open |
| TD-09 | GPU ECS for VTO | P0 | 3d | Open |
| TD-10 | Remove demo catalog fallback in prod | P2 | 2h | Mitigated (DDB default) |

## Resolved This Pass

- TD-11: Dead VTO duplicates removed ✅
- TD-12: Mock seller metrics → real computation ✅
- TD-13: Mock video inspect → Gemini/503 ✅
- TD-14: Default JWT secret production guard ✅
- TD-15: 38 scratch docs archived ✅
- TD-16: Observability middleware ✅
- TD-17: Size recommendation endpoint wired ✅

## Debt Ratio

**Before:** ~40% endpoints had mock/hardcoded production paths  
**After:** ~15% (demo-labeled endpoints + simulated logistics GPS)
