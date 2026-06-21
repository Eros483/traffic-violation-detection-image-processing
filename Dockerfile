# ----- multi-stage docker build for traffic violation detection api @ Dockerfile -----

# ---- Stage 1: Build React frontend ----
FROM node:20-alpine AS frontend

WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- Stage 2: Python runtime ----
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
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
RUN uv sync --no-dev --frozen

# Model weights (.pt) are copied in next step via COPY . .
# CPU-only inference: reduce thread/memory overhead for t3.micro (1GB RAM)
ENV OMP_NUM_THREADS=1
ENV MALLOC_ARENA_MAX=2
ENV MALLOC_TRIM_THRESHOLD_=131072
ENV PYTHONMALLOC=malloc

COPY . .

COPY --from=frontend /build/client/dist client/dist/

# Set VIRTUAL_ENV so non-uv commands can find packages too
ENV VIRTUAL_ENV=/app/.venv
ENV PATH=$VIRTUAL_ENV/bin:$PATH

RUN mkdir -p outputs public/outputs

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

CMD uv run uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
