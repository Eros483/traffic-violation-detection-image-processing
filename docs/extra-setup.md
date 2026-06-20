## Extra commands for setting up locally

| Command | Description |
|---------|-------------|
| `make setup` | Bootstrap environment (uv, deps, frontend) |
| `make run` | Build frontend + start API server at `localhost:8000` |
| `make run-api` | Start API server only (no frontend rebuild) |
| `make process` | Run detection pipeline on sample images |
| `make evaluate` | Run evaluation, generate `outputs/metrics.json` |
| `make test` | Run all tests (37 backend, 23 frontend) |
| `make format` | Format all Python code with black |
| `make format-check` | Check formatting without modifying |
| `make data` | Download raw datasets |
| `make download-model` | Download trained YOLOv8m weights |
| `make clean` | Remove generated outputs |

### Extra Environment Variables 

| Variable | Required | Description |
|----------|----------|-------------|
| `KAGGLE_USERNAME` | For `make data` | Kaggle username for dataset downloads |
| `KAGGLE_KEY` | For `make data` | Kaggle API key for dataset downloads |