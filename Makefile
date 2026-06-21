.PHONY: setup sync format format-check lint run-api process evaluate benchmark \
        data test clean client-install client-build run download-model \
        docker-build docker-push docker-run

# Install uv if not present, then sync all dependencies & install frontend deps
setup:
	@command -v uv >/dev/null 2>&1 || { echo "Installing uv..."; curl -LsSf https://astral.sh/uv/install.sh | sh; }
	uv sync
	@command -v npm >/dev/null 2>&1 && { $(MAKE) client-install; } || echo "⚠ npm not found — skipping frontend install."
	@echo "\n✓ Environment ready. Run 'make download-model' to get trained weights, then 'make process' to generate sample outputs."

# Sync dependencies (fast — uses lockfile)
sync:
	uv sync

# Format all Python files with black
format:
	uv run black .

# Check formatting without modifying files
format-check:
	uv run black --check src/ api/ tests/ utils/

# Run the FastAPI backend (without frontend)
run-api:
	uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Run the full detection pipeline on sample images
process:
	uv run python -m src.pipeline

# Run evaluation on test set
evaluate:
	uv run python -m src.evaluate

# Run pipeline benchmark (timing, throughput, memory)
benchmark:
	uv run python -c "from src.evaluate import benchmark_pipeline; benchmark_pipeline()"

# Download datasets (requires KAGGLE_USERNAME + KAGGLE_KEY env vars)
data:
	uv run kaggle datasets download -d devgurucodes/trafffic-violations-triple-riding-no-helmet-plate -p data/raw/ --unzip
	uv run kaggle datasets download -d pkdarabi/helmet -p data/raw/ --unzip
	uv run kaggle datasets download -d aneesarom/rider-with-helmet-without-helmet-number-plate -p data/raw/ --unzip
	@command -v git-lfs >/dev/null 2>&1 || { echo "Installing git-lfs..."; sudo apt-get install -y git-lfs; } && git lfs install && git clone https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset data/raw/indian-plates

# Download trained YOLOv8m .pt model weights from HuggingFace
download-model:
	@mkdir -p artifacts
	@echo "Downloading .pt model weights from HuggingFace..."
	curl -L -o artifacts/best.pt \
		https://huggingface.co/Eros483/traffic-violation-yolov8m/resolve/main/best.pt
	curl -L -o artifacts/yolov8n-pose.pt \
		https://huggingface.co/Eros483/traffic-violation-yolov8m/resolve/main/yolov8n-pose.pt
	@echo "✓ .pt model weights placed in artifacts/"


# Run tests
test:
	uv run pytest tests/ -v

# Remove generated artifacts (preserves metrics.json for realistic dashboard data)
clean:
	rm -f outputs/violations.jsonl outputs/challans.jsonl
	rm -rf public/outputs/*.jpg public/outputs/uploads
	@echo "✓ Cleaned violations, challans, and sample outputs. (metrics.json preserved)"

# ----- Frontend (React dashboard) -----

# Install frontend dependencies
client-install:
	cd client && npm ci

# Build frontend to client/dist/
client-build:
	cd client && npm run build

# Build frontend + start API (one command for full-stack serving)
run: client-build run-api

# ----- Docker (publish & run) -----

IMAGE_NAME ?= eros483/traffic-violation-detection
IMAGE_TAG ?= latest

# Build Docker image
docker-build:
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

# Push Docker image to registry
docker-push:
	docker push $(IMAGE_NAME):$(IMAGE_TAG)

# Run API via Docker (set GROQ_API_KEY to enable LLM features)
docker-run:
	docker run -p 8000:8000 \
		-e GROQ_API_KEY=$(GROQ_API_KEY) \
		$(IMAGE_NAME):$(IMAGE_TAG)