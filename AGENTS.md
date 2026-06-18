# AGENT.md

## Project Overview
A 6-day hackathon prototype that detects traffic violations (no-helmet, triple riding, license plates) from images using pretrained/lightly fine-tuned CV models, packages the results as evidence records, and exposes them via a backend REST API. Built for the Bengaluru Traffic Challenge. Full tech stack, scope, and day-by-day plan live in `docs/design.md` — that document takes precedence over the generic stack assumptions below.

## Tech Stack
See `docs/design.md` for the authoritative stack (Python, uv, FastAPI, Ultralytics YOLO, PaddleOCR, Groq vision LLM). This project has no frontend and no SQL database — outputs are served as JSON/JSONL via the API. The frontend (React dashboard) is out of scope, built by a separate team against this project's API contract.

## Key Commands

### Backend
```bash
make setup                       # bootstrap env (installs uv if missing, syncs deps)
make data                        # download datasets
make process                     # run detection pipeline on sample images
make evaluate                    # run evaluation, generate metrics.json
make run-api                     # start FastAPI dev server
make format                      # format with black
make format-check                # check formatting without modifying files
make test                        # run pytest
```

## Directory Structure

```
traffic-violation-prototype/
├── configs/
│   └── config.yaml              # all thresholds, paths, model configs (see design.md §3)
├── data/
│   ├── raw/                     # downloaded datasets (gitignored)
│   └── sample_outputs/          # ≥50 annotated evidence images
├── models/
│   └── weights/                 # downloaded/trained .pt files
├── src/
│   ├── preprocessing.py         # CLAHE + resize
│   ├── detector.py              # YOLOv8 vehicle/helmet/plate detection
│   ├── triple_riding.py         # YOLOv8-Pose occupant counting
│   ├── lpr.py                   # plate detection + OCR + validation
│   ├── llm_classifier.py        # optional vision LLM checks
│   ├── evidence.py              # annotated image + JSON + hash
│   ├── pipeline.py              # end-to-end: image → violation records
│   └── evaluate.py              # metrics on test set
├── api/
│   ├── main.py                  # FastAPI app entry point
│   ├── routes/
│   │   ├── violations.py        # CRUD + query endpoints for violations
│   │   ├── analytics.py         # aggregated stats & charts data
│   │   └── evidence.py          # serve annotated images & metadata
│   └── schemas.py               # Pydantic response models
├── utils/
│   ├── config.py                # Pydantic BaseSettings class, instantiated as `config`
│   ├── logger.py                # custom logger, imported as `logger`
│   └── [other helpers]
├── notebooks/
│   ├── 01_train_detector.ipynb  # fine-tuning notebook (Colab-ready)
│   ├── 02_evaluate.ipynb        # evaluation results + charts
│   └── 03_demo.ipynb            # interactive demo
├── tests/
│   ├── test_api/                # mirrors api/ structure
│   └── test_src/                # mirrors src/ structure
├── outputs/
│   ├── violations.jsonl         # all violation records
│   ├── metrics.json             # evaluation results
│   └── report.pdf               # auto-generated summary
├── docs/
│   ├── features.json            # canonical feature tracker — always kept up to date
│   └── design.md                # full project design doc (scope, plan, contracts)
├── Makefile                      # build automation (setup, format, lint, run, test)
├── pyproject.toml                # project metadata + dependencies (uv/PEP 621)
├── uv.lock                        # locked dependency versions (committed)
├── .env.example                   # committed, no secrets
├── .gitignore
├── README.md
└── AGENT.md
```

## Conventions

### Python (Backend)
- **Package manager: `uv`** — use `uv` for all dependency management (`uv add`, `uv run`, `uv sync`). Never use `pip` directly.
- Every backend file starts with a header comment: `# ----- <4-5 word purpose> @ <file location> -----`
  - Example: `# ----- user authentication logic @ backend/core/auth.py -----`
- Formatter: black (always)
- Naming: snake_case for everything — files, variables, functions, DB columns
- Imports: sorted (isort compatible with black)
- API routes are thin: validate input → call src/core logic → return output
- `src/` has zero knowledge of HTTP or FastAPI
- Env vars are accessed exclusively via the config object (`from utils.config import config`) — never use `os.environ` directly.

- Config is a Pydantic BaseSettings class instantiated once in `utils/config.py`. Initialise it as below configuration snippet.

````
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

load_dotenv()

class Settings(BaseSettings):
    """
    Central management for settings and configurations
    Reads .env file
    """

settings = Settings()
````

- All logging uses the custom logger (`from utils.logger import logger`) — never use `print` or the stdlib `logging` module directly. Initialise it as below.

````
import logging
import os
from datetime import datetime

LOGS_DIR="logs"
os.makedirs(LOGS_DIR, exist_ok=True)

LOG_FILE=os.path.join(LOGS_DIR, f"log_{datetime.now().strftime('%Y-%m-%d')}.log")

logging.basicConfig(
    filename=LOG_FILE,
    format='%(asctime)s-%(levelname)s-%(message)s',
    level=logging.INFO
)

def get_logger(name):
    logger=logging.getLogger(name)
    logger.setLevel(logging.INFO)
    return logger
````

### General
- Commits: conventional commits format (feat:, fix:, chore:, docs:, test:, refactor:)
- Env vars: never committed, always have a .env.example with keys but no values
- API versioned from day one under `/api/v1/`
- **README badges**: READMEs should include HTML shield badges (via [shields.io](https://shields.io)) for things like build status, version, license, and tech stack. Use raw HTML `<img>` tags, not Markdown image syntax, so badge layout and alignment can be controlled.

## Development Philosophy
- TDD first: write the test, then the implementation. Never skip.
- Tests mirror the structure of the module they test
- No function ships without a test
- API routes are thin — logic lives in `src/`
- Explicit over clever — readable code beats smart code

## Agent Roles

This project uses a three-agent workflow. Every task goes through all three stages.

- **Planner**: breaks down the task, identifies edge cases and risks, defines what tests need to exist, produces a written plan. Writes no code. Must check `/docs` for any relevant design documents before planning.
- **Builder**: implements exactly per the plan — no scope creep, no improvising. Writes tests first, then implementation.
- **Reviewer**: checks correctness, black formatting, snake_case compliance, test coverage, and edge cases. Flags anything that deviates from this AGENT.md. Verifies that `docs/features.json` has been updated to reflect the work done.

The Planner must finish before the Builder starts.
The Reviewer must approve before any task is considered done.

## Agent Guidelines
- Always run black before considering Python code done
- Always use snake_case — no exceptions for Python files, variables, functions
- Never modify files in `/docs` unless explicitly asked
- Always run tests after making changes — if tests fail, fix before moving on
- Every new backend file must start with the header comment — Reviewer should flag any file missing it
- Never use `os.environ` directly — always use `from utils.config import config`
- Never use `print` or stdlib `logging` — always use `from utils.logger import logger`
- Always use `uv` for Python package management — never invoke `pip` directly
- Always check `/docs` for relevant design documents before starting any task — if a design doc exists for what you're building, it takes precedence
- If a design doc is missing but the task is significant enough to warrant one, flag it to the user before proceeding
- Always update `docs/features.json` after completing any task — mark features as done, update test status, add new features if they were introduced. Follow the schema shape provided

````bash
// docs/features.json
{
  "project": "[project-name]",
  "last_updated": "YYYY-MM-DD",
  "summary": {
    "total": 0,
    "completed": 0,
    "in_progress": 0,
    "planned": 0,
    "tests_passing": 0,
    "tests_failing": 0,
    "tests_missing": 0
  },
  "features": [
    {
      "id": "F001",
      "name": "[Feature Name]",
      "description": "[What it does and why it exists]",
      "status": "planned",
      "priority": "high",
      "module": "backend/core",
      "design_doc": "docs/[relevant-design-doc].md",
      "tests": {
        "status": "missing",
        "files": [],
        "notes": ""
      },
      "subtasks": [
        {
          "id": "F001-1",
          "name": "[Subtask name]",
          "status": "planned"
        }
      ],
      "notes": "",
      "added": "YYYY-MM-DD",
      "completed": null
    }
  ]
}
````

- If something feels out of scope, flag it rather than silently doing it

## Project-Specific Notes
- External APIs: Kaggle API (`KAGGLE_USERNAME`, `KAGGLE_KEY`) for dataset downloads; Groq API (`GROQ_API_KEY`) for optional vision LLM checks — only required if `llm_violations.enabled: true` in `configs/config.yaml`.
- Non-standard setup: `git lfs` is required to clone the Indian Number Plates dataset from HuggingFace.
- Never touch: `data/raw/` (gitignored, regenerated via `make data`), `models/weights/` (downloaded/trained, not hand-edited).
- Deployment target: none — this is a local/Colab prototype only. No Docker, K8s, or production deployment in scope.
- Known gotchas: dataset class-name drift (`Plate` vs `NumberPlate`) across source datasets can silently break detector-to-violation mapping; verify class names before wiring `src/detector.py` to a new dataset.