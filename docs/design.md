# Design.md — Traffic Violation Detection Prototype

## Bengaluru Traffic Challenge — Stripped-Down Hackathon Build

> Engineering conventions, agent workflow, directory structure, and commands live in `AGENT.md`. This document covers only project-specific scope, datasets, day-by-day plan, and technical contracts.

## Philosophy

- **Zero manual annotation** — use only pre-annotated public datasets
- **Use pretrained models** — fine-tune minimally or use as-is
- **No deployment infrastructure** — runs locally or on Colab with GPU
- **Prototype quality** — demonstrate the pipeline end-to-end, not production robustness
- **Score maximization** — working code + sample outputs + demo video score highest

## Tech Stack (Authoritative — takes precedence over AGENT.md generic stack)

- Language/runtime: Python ≥3.10
- Detection: Ultralytics YOLOv8 (YOLOv8m for violations, YOLOv8n-pose for occupant counting)
- OCR: PaddleOCR PP-OCRv4
- Backend API: FastAPI + Uvicorn
- Optional reasoning layer: Groq vision LLM (`meta-llama/llama-4-scout-17b-16e-instruct`)
- Package manager: uv
- Formatter: black
- No database — persistence is JSONL (`outputs/violations.jsonl`) + JSON (`outputs/metrics.json`) + flat files
- No frontend in this repo — a React dashboard is built by a separate team against the API contract in §6

## Datasets (All Free, Pre-Annotated, No Manual Work)

| Dataset | Source | Size | Format | Classes / Content | License |
|---|---|---|---|---|---|
| Traffic Violations (Primary) | Kaggle: devgurucodes/trafffic-violations-triple-riding-no-helmet-plate | 708 MB | YOLO txt (train/valid/test splits ready) | WithHelmet, WithoutHelmet, TripleRiding, Plate | ODbL (open) |
| HelmetViolations | Kaggle: pkdarabi/helmet | 220 MB | YOLO format + includes pretrained `best.pt` | Plate, WithHelmet, WithoutHelmet | CC BY 4.0 |
| Rider/Helmet/Plate | Kaggle: aneesarom/rider-with-helmet-without-helmet-number-plate | ~78 MB | YOLO format | Rider, WithHelmet, WithoutHelmet, NumberPlate | Open |
| Indian Number Plates (OCR) | HuggingFace: Dataclusterlabspvtltd/indian-number-plates-dataset | ~200 images | Pascal VOC XML + number_plate_text attribute | number_plate + OCR ground truth | CC BY-NC-ND 4.0 |
| Indian Driving Dataset (YOLOv11) | Kaggle: redzapdos123/indian-driving-dataset-detections-yolov11 | 22 GB | YOLO format | Multi-class Indian vehicles | Research |
| Gujarat Number Plates | Kaggle: paneraghanshyam/gujarat-vehicle-number-plates-yolo-ready | ~46 MB | YOLO format | number_plate | Open |

**Pretrained models available:**

- pkdarabi/helmet dataset ships a `best.pt` (YOLOv8 trained weights)
- HuggingFace: JarvanLee/yolov8-helmet-violation-detection — Apache 2.0 licensed pretrained YOLOv8
- YOLOv8-Pose (COCO pretrained from Ultralytics) — for occupant counting (triple riding)
- PaddleOCR PP-OCRv4 — pretrained, works out of the box for plate text

## What We're Building (Scoped for 6 Days)

### In Scope (Must Ship)

1. **Image preprocessing** — CLAHE low-light enhancement + basic resize
2. **Helmet violation detection** — using pretrained/fine-tuned YOLO on existing datasets
3. **Triple riding detection** — YOLOv8-Pose occupant counting
4. **License plate recognition** — plate detection + PaddleOCR + KA-format validation
5. **Evidence packaging** — annotated image + JSON metadata + SHA-256 hash
6. **Backend REST API** — FastAPI service exposing endpoints for violations, analytics, and evidence retrieval (serves the React dashboard)
7. **Evaluation script** — precision/recall/F1 on test set
8. **50+ sample annotated outputs**
9. **Optional LLM-assisted violations** — Groq vision model with per-use-case config toggles (mobile phone, wrong-side, red-light, seatbelt)

### Out of Scope (Mentioned in Report as "Future Work")

- React Dashboard UI — separate React-based frontend application (will be built by another team; our backend API serves it)
- Production-grade wrong-side driving stack (temporal + lane topology + calibrated camera geometry)
- Production-grade red-light / stop-line stack (signal state + stop-line localization + temporal crossing logic)
- Illegal parking (needs temporal context)
- Production-grade seatbelt detection (windscreen/interior-focused model + camera angle constraints)
- Production-grade mobile phone use detection (driver/rider pose + hand-object temporal modeling)
- Any production deployment (Docker, K8s, queues, MinIO)
- Real-time RTSP camera ingestion

### Stretch Goals (If Time Permits on Day 5-6)

- Red-light detection (signal color classifier + stop-line heuristic)
- Basic traffic signal state detection

## Optional LLM-Assisted Features (Config-Toggleable)

- **Provider:** Groq free vision API
- **Model:** `meta-llama/llama-4-scout-17b-16e-instruct` (configurable)
- **Master toggle:** `llm_violations.enabled`
- **Per-use-case toggles:**
  - `llm_violations.classifications.mobile_phone.enabled`
  - `llm_violations.classifications.wrong_side_driving.enabled`
  - `llm_violations.classifications.red_light.enabled`
  - `llm_violations.classifications.seatbelt.enabled`
- **Behavior:** when enabled, LLM checks run after CV detections and are stored as image-level violations in evidence JSON

## Day-by-Day Plan

### Day 1: Setup + Data + Detection Model

**Morning:**

- Initialize repo with `uv init`, configure `pyproject.toml`, create project structure (see AGENT.md for directory layout)
- Run `make setup` to bootstrap environment
- Download datasets:

```bash
uv run kaggle datasets download -d devgurucodes/trafffic-violations-triple-riding-no-helmet-plate
uv run kaggle datasets download -d pkdarabi/helmet
uv run kaggle datasets download -d aneesarom/rider-with-helmet-without-helmet-number-plate
git lfs install
git clone https://huggingface.co/datasets/Dataclusterlabspvtltd/indian-number-plates-dataset data/raw/indian-plates
```

- Explore data structure, verify YOLO label format, check class distributions

**Afternoon:**

- Fine-tune YOLOv8m on the combined traffic violations dataset (or use pretrained `best.pt` from pkdarabi):

```python
from ultralytics import YOLO

model = YOLO("yolov8m.pt")
model.train(
    data="data/master_traffic_violation_dataset/data.yaml",
    epochs=30,
    imgsz=640,
    batch=16,
    device=0,
    project="models/weights",
    name="traffic_violations"
)
```

- If using Colab (free T4), training 30 epochs on ~11k images takes ~2-3 hours
- Validate mAP on test split

**Deliverable:** Trained detection model (`best.pt`) detecting: WithHelmet, WithoutHelmet, TripleRiding, Plate

### Day 2: Triple Riding + Helmet Logic + Preprocessing

**Morning:**

Implement `src/preprocessing.py`:

```python
import cv2
import numpy as np

def preprocess(image: np.ndarray) -> tuple[np.ndarray, list[str]]:
    steps = []
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    mean_lum = lab[:, :, 0].mean()
    if mean_lum < 60:
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        lab[:, :, 0] = clahe.apply(lab[:, :, 0])
        image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        steps.append("clahe_enhancement")
    return image, steps
```

Implement `src/triple_riding.py` using YOLOv8-Pose:

```python
from ultralytics import YOLO

pose_model = YOLO("yolov8n-pose.pt")

def count_riders(image, vehicle_bbox):
    x1, y1, x2, y2 = vehicle_bbox
    pad = 0.3
    h, w = image.shape[:2]
    cx1 = max(0, int(x1 - (x2 - x1) * pad))
    cy1 = max(0, int(y1 - (y2 - y1) * pad))
    cx2 = min(w, int(x2 + (x2 - x1) * pad))
    cy2 = min(h, int(y2 + (y2 - y1) * pad))
    crop = image[cy1:cy2, cx1:cx2]
    results = pose_model(crop, verbose=False)
    person_count = len(results[0].boxes) if results[0].boxes is not None else 0
    return person_count
```

**Afternoon:**

- Implement `src/detector.py` — wrapper around trained YOLOv8:
  - WithoutHelmet → helmet violation
  - TripleRiding → triple riding violation
  - Plate → pass bbox to LPR pipeline
- Wire helmet detection + triple riding into a single `detect_violations(image)` function
- Test on 20 sample images, visually inspect results

**Deliverable:** Working violation detection on images (helmet + triple riding)

### Day 3: License Plate Recognition Pipeline

**Morning:**

Implement `src/lpr.py`:

```python
from paddleocr import PaddleOCR
import re

ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)

KA_PLATE_PATTERN = re.compile(r"^KA\s?\d{2}\s?[A-Z]{1,3}\s?\d{1,4}$", re.IGNORECASE)
OCR_CONFUSION = {'0': 'O', 'O': '0', '1': 'I', 'I': '1', '8': 'B', 'B': '8', '5': 'S', 'S': '5'}

def read_plate(plate_crop):
    h, w = plate_crop.shape[:2]
    if w < 100:
        plate_crop = cv2.resize(plate_crop, (w * 3, h * 3), interpolation=cv2.INTER_CUBIC)
    results = ocr.ocr(plate_crop, cls=True)
    if not results or not results[0]:
        return {"text": None, "confidence": 0.0, "valid": False}
    raw_text = " ".join([line[1][0] for line in results[0]])
    confidence = min([line[1][1] for line in results[0]])
    corrected, is_valid = validate_and_correct(raw_text)
    return {"text": corrected, "confidence": confidence, "valid": is_valid, "raw": raw_text}

def validate_and_correct(raw_text):
    text = raw_text.upper().replace(" ", "").replace("-", "")
    if KA_PLATE_PATTERN.match(text):
        return format_plate(text), True
    for wrong, right in OCR_CONFUSION.items():
        candidate = text.replace(wrong, right)
        if KA_PLATE_PATTERN.match(candidate):
            return format_plate(candidate), True
    return raw_text, False

def format_plate(text):
    import re
    text = re.sub(r'[^A-Z0-9]', '', text.upper())
    if len(text) >= 10:
        return f"{text[:2]}-{text[2:4]}-{text[4:6]}-{text[6:]}"
    return text
```

**Afternoon:**

- Test LPR on the DataCluster Labs sample (200 images with ground truth plate text)
- Measure character accuracy and plate accuracy
- Integrate plate detection from YOLO → crop → OCR
- Handle edge cases: no plate, low confidence, non-KA plates

**Deliverable:** Working LPR pipeline with measured accuracy

### Day 4: Evidence Packaging + End-to-End Pipeline

**Morning:**

Implement `src/evidence.py`:

```python
import hashlib, json, uuid
from datetime import datetime
from dataclasses import dataclass, asdict

@dataclass
class ViolationRecord:
    violation_id: str
    timestamp: str
    image_path: str
    image_hash: str
    vehicle_bbox: list
    vehicle_type: str
    plate_number: str | None
    plate_confidence: float | None
    violations: list[dict]
    severity: str
    legal_sections: list[str]

LEGAL_MAP = {
    "helmet": "MV Act S129",
    "triple_riding": "MV Act S128",
}

def package_evidence(image, image_path, detections):
    image_hash = hashlib.sha256(open(image_path, 'rb').read()).hexdigest()
    records = []
    for det in detections:
        record = ViolationRecord(
            violation_id=str(uuid.uuid4()),
            timestamp=datetime.now().isoformat(),
            image_path=image_path,
            image_hash=image_hash,
            vehicle_bbox=det["bbox"],
            vehicle_type=det["vehicle_type"],
            plate_number=det.get("plate_text"),
            plate_confidence=det.get("plate_confidence"),
            violations=det["violations"],
            severity="high" if any(v["type"] in ["red_light"] for v in det["violations"]) else "standard",
            legal_sections=[LEGAL_MAP.get(v["type"], "") for v in det["violations"]]
        )
        records.append(record)
    return records

def annotate_image(image, records):
    import cv2
    img = image.copy()
    for rec in records:
        x1, y1, x2, y2 = rec.vehicle_bbox
        color = (0, 0, 255) if rec.severity == "high" else (0, 165, 255)
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        for v in rec.violations:
            label = f"{v['type']} ({v['confidence']:.2f})"
            cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        if rec.plate_number:
            cv2.putText(img, rec.plate_number, (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
    return img
```

**Afternoon:**

Implement `src/pipeline.py` — end-to-end orchestrator:

```python
def process_image(image_path: str) -> dict:
    image = cv2.imread(image_path)
    image, preprocess_steps = preprocess(image)
    detections = detect_violations(image)
    for det in detections:
        if det.get("plate_bbox"):
            plate_crop = image[det["plate_bbox"][1]:det["plate_bbox"][3],
                                det["plate_bbox"][0]:det["plate_bbox"][2]]
            plate_result = read_plate(plate_crop)
            det["plate_text"] = plate_result["text"]
            det["plate_confidence"] = plate_result["confidence"]
    records = package_evidence(image, image_path, detections)
    annotated = annotate_image(image, records)
    return {"records": records, "annotated_image": annotated}
```

- Run pipeline on 50+ images → generate `sample_outputs/`
- Export all records to `outputs/violations.jsonl`

**Deliverable:** 50+ annotated evidence images + JSONL records

### Day 5: Backend API + Evaluation + Analytics

**Morning:**

- Implement `src/evaluate.py` — run YOLO val on test split, extract mAP/P/R per class
- Compute LPR accuracy on DataCluster sample (character-level + full-plate)
- Generate `outputs/metrics.json`

**Afternoon:**

Build `api/main.py` (FastAPI) — backend REST API to serve the React dashboard:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import violations, analytics, evidence

app = FastAPI(title="Traffic Violation Detection API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(violations.router, prefix="/api/violations", tags=["violations"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(evidence.router, prefix="/api/evidence", tags=["evidence"])
```

Implement API endpoints:

- `GET /api/violations` — list violations with pagination, filtering by type/date/plate
- `GET /api/violations/{id}` — single violation detail
- `GET /api/analytics/summary` — total counts, breakdown by type
- `GET /api/analytics/metrics` — model performance (mAP, P/R/F1 per class)
- `GET /api/evidence/{id}/image` — serve annotated evidence image
- `GET /api/evidence/{id}/metadata` — JSON metadata + hash
- `POST /api/process` — accept an image, run pipeline, return results

Add Pydantic response schemas in `api/schemas.py`

**Deliverable:** Working REST API backend ready for React dashboard consumption

> **Note:** The React dashboard frontend is out of scope — built by a separate team. Our API provides all data it needs.

### Day 6: Complete deliverables

**Deliverable:** Complete submission (code + report + demo + samples)

## Module Responsibilities

| File | Responsibility | Inputs | Outputs | Common Failure Modes |
|---|---|---|---|---|
| `src/preprocessing.py` | CLAHE + resize + preprocessing metadata | np.ndarray image, config | (processed_image, preprocess_steps) | invalid image dtype/shape |
| `src/detector.py` | YOLO inference + violation mapping + plate association | processed image, detector config | list[dict] violation candidates | missing weights, class-name mismatch, low confidence/no detections |
| `src/lpr.py` | plate crop OCR + KA validation/correction | plate crop, OCR config | {text, confidence, valid, raw} | empty crop, OCR timeout/empty output, malformed chars |
| `src/llm_classifier.py` | optional vision LLM checks (image-level) | image, llm config + API key | list[dict] image-level violations | missing API key, network/API errors, non-deterministic output |
| `src/evidence.py` | hash + legal mapping + record packing + annotation | original image path + detections + config | list[ViolationRecord], annotated image, JSONL writes | bbox/image-level mismatch, missing legal mapping |
| `src/pipeline.py` | orchestration of all stages | image path(s), config | records + annotated image + summaries | any stage exception; partial outputs |
| `src/evaluate.py` | detector/LPR metrics + metrics.json | dataset YAML, GT folder | metrics report JSON | missing datasets/annotations |
| `api/routes/*.py` | serve records, analytics, evidence, process endpoint | HTTP request + outputs/* | JSON/API responses | schema drift, stale files, missing records |

## Canonical Data Contracts

### Detector output item (vehicle-level)

```json
{
  "bbox": [x1, y1, x2, y2],
  "vehicle_type": "two_wheeler",
  "violations": [
    {
      "type": "helmet",
      "confidence": 0.91,
      "description": "Rider without helmet detected"
    }
  ],
  "plate_bbox": [x1, y1, x2, y2] | null,
  "plate_text": "KA-01-AB-1234" | null,
  "plate_confidence": 0.82 | null
}
```

### LLM image-level output item

```json
{
  "bbox": null,
  "vehicle_type": "vehicle",
  "violations": [
    {
      "type": "mobile_phone",
      "detected": true,
      "confidence": 0.80,
      "reasoning": "yes, rider appears to be using a phone"
    }
  ],
  "plate_bbox": null,
  "plate_text": null,
  "plate_confidence": null
}
```

### Evidence JSONL record (persisted)

```json
{
  "violation_id": "uuid",
  "timestamp": "ISO-8601",
  "image_path": "path/to/input.jpg",
  "image_hash": "sha256",
  "vehicle_bbox": [x1, y1, x2, y2] | null,
  "vehicle_type": "two_wheeler|vehicle|unknown",
  "plate_number": "KA-01-AB-1234" | null,
  "plate_confidence": 0.82 | null,
  "violations": [{"type": "helmet", "confidence": 0.91}],
  "severity": "high|standard",
  "legal_sections": ["MV Act S129"]
}
```

## Config Reference (configs/config.yaml)

Minimum required keys:

```yaml
models:
  detector:
    weights: models/weights/traffic_violations/best.pt
    fallback_weights: yolov8m.pt
    confidence_threshold: 0.5
    iou_threshold: 0.45
    image_size: 640
  pose:
    weights: yolov8n-pose.pt
    confidence_threshold: 0.5
  ocr:
    lang: en
    use_angle_cls: true

detection:
  reporting_confidence: 0.7
  triple_riding_threshold: 3
  vehicle_pad_ratio: 0.3

plate:
  ka_pattern: "^KA\\s?\\d{2}\\s?[A-Z]{1,3}\\s?\\d{1,4}$"
  min_crop_width: 100
  upscale_factor: 3

llm_violations:
  enabled: false
  provider: groq
  model: meta-llama/llama-4-scout-17b-16e-instruct
  api_key_env: GROQ_API_KEY
  timeout_seconds: 30
  classifications:
    mobile_phone: { enabled: true, confidence_threshold: 0.7 }
    wrong_side_driving: { enabled: false, confidence_threshold: 0.6 }
    red_light: { enabled: false, confidence_threshold: 0.7 }
    seatbelt: { enabled: false, confidence_threshold: 0.6 }
```

Note: these values are loaded into the project's Settings object per AGENT.md's config convention (`utils/config.py`) — never read directly via `os.environ`.

## Error Handling and Fallback Policy

1. If detector weights are missing, use `fallback_weights`.
2. If OCR fails/returns empty, set `plate_text=null`, `plate_confidence=0.0`.
3. If LLM is enabled but API key/package is missing, log warning and continue pipeline with CV-only detections.
4. If one image fails in directory mode, continue remaining images and report per-file error.
5. If legal mapping key is missing, keep empty section for that violation type and include in report under known gaps.

## API Contract Summary (for Frontend Team)

| Endpoint | Method | Purpose | Notes |
|---|---|---|---|
| `/health` | GET | service health | should return `{status: "ok"}` |
| `/api/violations` | GET | paginated list + filters | supports page, page_size, violation_type, plate, severity |
| `/api/violations/{id}` | GET | single violation | 404 if not found |
| `/api/violations/process` | POST | process one image path | returns records + preprocess steps |
| `/api/analytics/summary` | GET | counts by type/severity | source: outputs/violations.jsonl |
| `/api/analytics/metrics` | GET | model metrics | source: outputs/metrics.json |
| `/api/evidence/{id}/image` | GET | annotated image | JPEG response |
| `/api/evidence/{id}/metadata` | GET | evidence metadata | includes hash + legal sections |

## Quick Runbook

```bash
make setup
make data
make process
make evaluate
make run-api
```

Optional LLM flow:

```bash
export GROQ_API_KEY="<key>"
# set llm_violations.enabled: true in configs/config.yaml
make process
```

## Testing Matrix (Project-Specific Minimum Cases)

> General TDD philosophy (write test first, no function ships without one) is defined in AGENT.md. This table lists the minimum project-specific cases each area must cover.

| Area | Test Type | Minimum Cases |
|---|---|---|
| Preprocessing | unit | low-light image applies CLAHE; normal-light does not |
| Detector mapping | unit | WithoutHelmet -> helmet, TripleRiding -> triple_riding |
| Plate association | unit | nearest plate assigned only within distance threshold |
| LPR parsing | unit | valid KA plate, OCR confusion correction, empty crop |
| LLM integration | unit/integration | disabled mode, enabled mode with missing key, enabled mode with mocked success |
| Evidence packager | unit | hash generation, severity mapping, legal section mapping |
| Pipeline | integration | single image success, per-image failure isolation in directory mode |
| API routes | integration | pagination/filter behavior, 404 paths, process endpoint success |

## Definition of Done (Project-Specific)

1. `make process` generates annotated outputs and `outputs/violations.jsonl` without crashes on 50+ images.
2. `make evaluate` generates `outputs/metrics.json` with detector metrics and (when GT exists) LPR metrics.
3. All listed API endpoints return valid schemas and expected status codes.
4. LLM feature is truly optional and fully controlled via config toggles.
5. README includes exact setup + run commands and required environment variables.
6. Demo run can be reproduced on a fresh machine using `make setup` + documented commands only.

## Known Risks to Track During Build

1. Dataset class-name drift (Plate vs NumberPlate) can silently break mapping logic.
2. LPR accuracy may vary heavily with blur/night and crop quality.
3. Image-level LLM violations are useful for prototype signals but not court-grade evidence.
4. JSONL file growth can become a bottleneck; acceptable for prototype, not for production.

## pyproject.toml

```toml
[project]
name = "traffic-violation-prototype"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "ultralytics>=8.1.0",
    "paddlepaddle>=2.5.0",
    "paddleocr>=2.7.0",
    "opencv-python>=4.8.0",
    "numpy>=1.24.0",
    "fastapi>=0.109.0",
    "uvicorn>=0.27.0",
    "Pillow>=10.0.0",
    "pyyaml>=6.0",
    "groq>=0.4.1",
]

[dependency-groups]
dev = [
    "black>=24.0",
    "pytest>=8.0",
    "kaggle>=1.6",
]

[tool.black]
line-length = 100
target-version = ["py310"]
```

## Makefile

```makefile
.PHONY: setup sync format format-check lint run-api process evaluate clean

# Install uv if not present, then sync all dependencies
setup:
	@command -v uv >/dev/null 2>&1 || { echo "Installing uv..."; curl -LsSf https://astral.sh/uv/install.sh | sh; }
	uv sync
	@echo "\n✓ Environment ready. Run 'make run-api' to start the server."

# Sync dependencies (fast — uses lockfile)
sync:
	uv sync

# Format all Python files with black
format:
	uv run black src/ api/ notebooks/ tests/

# Check formatting without modifying files
format-check:
	uv run black --check src/ api/ notebooks/ tests/

# Run the FastAPI backend
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
```

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Detection model | YOLOv8m | Best speed/accuracy tradeoff; fine-tunes in <3 hrs on Colab T4 |
| Helmet/violation dataset | devgurucodes YOLO dataset | Pre-split, YOLO format, 4 perfect classes, 708MB |
| Occupant counting | YOLOv8n-pose (COCO pretrained) | Zero training needed; count keypoints in vehicle bbox |
| OCR engine | PaddleOCR PP-OCRv4 | Free, excellent accuracy, pip install |
| Backend API | FastAPI | Lightweight, async, auto-generates OpenAPI docs for React team |
| Optional reasoning layer | Groq vision LLM (llava-1.5-7b-4096) | Fast prototype path for hard visual behaviors (toggleable per use case) |
| Evidence format | JSONL + annotated JPG + SHA-256 | Matches task requirements exactly |
| Confidence threshold | 0.5 detect / 0.7 report | Minimize false positives in demo |
