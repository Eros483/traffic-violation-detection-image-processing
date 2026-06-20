.PHONY: setup sync format format-check lint run-api process evaluate \
        data test clean client-install client-build run

# Install uv if not present, then sync all dependencies & install frontend deps
setup:
	@command -v uv >/dev/null 2>&1 || { echo "Installing uv..."; curl -LsSf https://astral.sh/uv/install.sh | sh; }
	uv sync
	@command -v npm >/dev/null 2>&1 && { $(MAKE) client-install; } || echo "⚠ npm not found — skipping frontend install."
	@echo "\n✓ Environment ready. Run 'make run' to build frontend + start server, or 'make run-api' for backend only."

# Sync dependencies (fast — uses lockfile)
sync:
	uv sync

# Format all Python files with black
format:
	uv run black .

# Check formatting without modifying files
format-check:
	uv run black --check src/ api/ notebooks/ tests/ utils/

# Run the FastAPI backend (without frontend)
run-api:
	uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Run the full detection pipeline on sample images
process:
	uv run python -m src.pipeline

# Run evaluation on test set
evaluate:
	uv run python -m src.evaluate

# Download datasets (requires KAGGLE_USERNAME + KAGGLE_KEY env vars)
data:
	uv run kaggle datasets download -d devgurucodes/trafffic-violations-triple-riding-no-helmet-plate -p data/raw/ --unzip
	uv run kaggle datasets download -d pkdarabi/helmet -p data/raw/ --unzip
	uv run kaggle datasets download -d aneesarom/rider-with-helmet-without-helmet-number-plate -p data/raw/ --unzip
	git lfs install && git clone https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset data/raw/indian-plates

# Run tests
test:
	uv run pytest tests/ -v

# Remove generated artifacts
clean:
	rm -rf outputs/*.jsonl outputs/*.json data/sample_outputs/*.jpg
	@echo "✓ Cleaned generated outputs."

# ----- Frontend (React dashboard) -----

# Install frontend dependencies
client-install:
	cd client && npm ci

# Build frontend to client/dist/
client-build:
	cd client && npm run build

# Build frontend + start API (one command for full-stack serving)
run: client-build run-api