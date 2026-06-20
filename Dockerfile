# ----- multi-stage docker build for traffic violation detection api @ Dockerfile -----

# ---- Stage 1: Build React frontend ----
FROM node:20-alpine AS frontend

WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci --omit=optional
COPY client/ ./
RUN npm run build

# ---- Stage 2: Python runtime ----
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --frozen --system

# Pre-download PaddleOCR models (fetched from remote at runtime otherwise)
RUN uv run python -c "from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=True, lang='en')"

COPY . .

COPY --from=frontend /build/client/dist client/dist/

RUN mkdir -p outputs public/outputs

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD uv run python -c "import os, urllib.request; urllib.request.urlopen('http://localhost:' + os.environ.get('PORT', '8000') + '/health')" || exit 1

CMD uv run uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
