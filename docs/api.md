## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/violations` | List violations (pagination, filters) |
| `GET` | `/api/v1/violations/{id}` | Violation detail |
| `POST` | `/api/v1/violations/process` | Run pipeline on server-side image path |
| `POST` | `/api/v1/violations/upload` | Upload image → run pipeline → return results |
| `GET` | `/api/v1/analytics/summary` | Dashboard KPI summary |
| `GET` | `/api/v1/analytics/metrics` | Evaluation metrics |
| `GET` | `/api/v1/evidence/{id}/image` | Annotated evidence image |
| `GET` | `/api/v1/evidence/{id}/metadata` | Evidence JSON metadata |
| `POST` | `/api/v1/challans` | Create challan from violation |
| `GET` | `/api/v1/challans` | List challans |
| `GET` | `/api/v1/challans/{id}` | Challan detail |