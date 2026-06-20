<div align="center">

# Traffic Violation Detection API

<p>
  <img src="https://img.shields.io/badge/python-3.10+-blue.svg" alt="Python Version">
  <img src="https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/YOLOv8-Medium-FF9D00.svg?logo=ultralytics" alt="YOLOv8">
  <img src="https://img.shields.io/badge/PaddleOCR-PP--OCRv4-blue" alt="PaddleOCR">
  <img src="https://img.shields.io/badge/code%20style-black-000000.svg" alt="Code Style: Black">
</p>

A prototype for the Bengaluru Traffic Challenge that detects traffic violations (no-helmet, triple riding, license plates) from images using CV models, packages the results as evidence records, and exposes them via a React dashboard.

</div>

---

## Quick Start

```bash
# 1. Set up environment variables (REQUIRED first step)
cp .env.example .env
# Edit .env with your keys — see "Environment Variables" below

# 2. Install uv + sync dependencies + frontend
make setup

# 3. Download trained model weights (no auth required)
make download-model

# 4. Start the full app (builds frontend + starts API)
make run

# Open http://localhost:8000 in your browser.
```

## Prerequisites

- Python 3.10+
- npm (for building the React dashboard)
- `git lfs` (for the Indian Number Plates dataset — only needed if running `make data`)

## Environment Variables

Copy `.env.example` to `.env` **before** running any other commands:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `KAGGLE_USERNAME` | For `make data` | Kaggle username for dataset downloads |
| `KAGGLE_KEY` | For `make data` | Kaggle API key for dataset downloads |
| `GROQ_API_KEY` | For LLM features | Groq API key for optional vision LLM checks (mobile phone, wrong-side driving, red light, seatbelt, stop line, illegal parking) |

LLM-assisted violations are **enabled by default** in `configs/config.yaml` (`llm_violations.enabled: true`). Set `GROQ_API_KEY` in `.env` to use them. If you don't have a key, set `enabled: false` in the config — the CV-only pipeline (helmet, triple riding, plate) works without it.

## Setup Steps

### 1. Clone & Configure

```bash
git clone <repo-url>
cd traffic-violation-prototype
cp .env.example .env   # edit with your keys
```

### 2. Install Dependencies

```bash
make setup
```

This installs `uv` (if missing), syncs Python dependencies from `uv.lock`, and runs `npm ci` in `client/` (if npm is available).

### 3. Download Model Weights

```bash
make download-model
```

Downloads the fine-tuned YOLOv8m weights (`best.pt`, ~85 MB) from HuggingFace to `models/weights/traffic_violations/best.pt`. **No authentication required** — uses a direct `curl` download from a public repo.

### 4. (Optional) Download Datasets

```bash
make data
```

Downloads the training datasets from Kaggle and HuggingFace. Requires `KAGGLE_USERNAME`/`KAGGLE_KEY` in `.env` and `git lfs`.

## Commands

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

## Project Structure

```
├── configs/config.yaml         # All thresholds, paths, model configs
├── data/                       # Datasets (gitignored) + sample outputs
├── models/weights/             # Trained .pt files
├── src/                        # Detection pipeline modules
│   ├── preprocessing.py        # CLAHE + resize
│   ├── detector.py             # YOLOv8 vehicle/helmet/plate detection
│   ├── triple_riding.py        # YOLOv8-Pose occupant counting
│   ├── lpr.py                  # Plate detection + OCR + validation
│   ├── llm_classifier.py       # Optional Groq vision LLM checks
│   ├── evidence.py             # Annotated image + JSON + hash
│   ├── pipeline.py             # End-to-end orchestration
│   └── evaluate.py             # Metrics on test set
├── api/                        # FastAPI backend
│   ├── main.py                 # App entry point
│   ├── routes/                 # violations, analytics, evidence, challans
│   └── schemas.py              # Pydantic response models
├── client/                     # React dashboard (Vite + TS + Tailwind)
├── tests/                      # Backend tests (mirror src/ + api/)
├── outputs/                    # violations.jsonl, metrics.json, reports
├── docs/                       # Design doc + feature tracker
└── utils/                      # Config loader + logger
```

## License

MIT
