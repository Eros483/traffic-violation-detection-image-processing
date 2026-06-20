## Windows Setup

Bare-minimum setup for machines without `make` / WSL. Run all commands in **PowerShell** or **cmd**.

### Prerequisites

- Python 3.10+
- Git for Windows
- Node.js & npm (for the React dashboard)

### Setup

```powershell
git clone https://github.com/Eros483/traffic-violation-detection-image-processing.git
cd traffic-violation-detection-image-processing
copy .env.example .env

REM Install uv (Python package manager)
powershell -c "& { Invoke-WebRequest -Uri https://astral.sh/uv/install.ps1 -OutFile uv-install.ps1; .\uv-install.ps1 }"

REM Install Python dependencies
uv sync

REM Install and build frontend
cd client
npm ci
npm run build
cd ..

REM Download trained model weights
mkdir artifacts
curl -L -o artifacts/best.pt https://huggingface.co/Eros483/traffic-violation-yolov8m/resolve/main/best.pt

REM Start the API server
uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Then open `http://localhost:8000` in your browser.

### Alternative Commands (PowerShell)

| Goal | Command |
|------|---------|
| Start API only (no frontend rebuild) | `uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000` |
| Run detection pipeline | `uv run python -m src.pipeline` |
| Run tests | `uv run pytest tests\ -v` |
| Format code | `uv run black .` |
| Download datasets | See `Makefile` lines 36-40 (requires kaggle CLI + git-lfs) |
