# Documentation Cleanup Report

**Date:** 2026-06-15

## Removed / Archived

- **38 root-level markdown files** moved to `docs/archive/development-notes/`
- Deleted obsolete `readme.md` (replaced by `README.md`)
- Deleted duplicate VTO views, fix scripts, dead Python modules

## Canonical Docs (kept)

```
docs/
├── architecture.md
├── api.md
├── database.md
├── deployment.md
├── security.md
├── testing.md
├── ml-architecture.md
├── impact.md
├── troubleshooting.md
├── aws-review.md
├── README.md
└── reports/
```

## Legacy Docs (reference only)

- `docs/01_product_and_strategy/`
- `docs/02_architecture_and_design/`
- `docs/03_features_and_modules/`
- `docs/04_hackathon_and_execution/`
- `docs/archive/`

These remain for historical context but are superseded by canonical docs above.

## Not Deleted (intentional)

- `backend/ml-service/KOLORS_VTO_README.md` — operational VTO setup
- `frontend/README.md` — frontend-specific notes
