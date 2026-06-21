<div align="center">

# Traffic Violation Detection Service

Built for the Flipkart Gridlock 2.0. Check out the live demo up on [AWS!](http://traffic-violation-api.eba-7aat7qza.ap-south-1.elasticbeanstalk.com/#/)

<p>
  <img src="https://img.shields.io/badge/python-3.10+-blue.svg" alt="Python Version">
  <img src="https://img.shields.io/badge/React-18-61DAFB.svg?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/YOLOv8-Medium-FF9D00.svg?logo=ultralytics" alt="YOLOv8">
  <img src="https://img.shields.io/badge/PaddleOCR-PP--OCRv4-blue" alt="PaddleOCR">
  <img src="https://img.shields.io/badge/code%20style-black-000000.svg" alt="Code Style: Black">
</p>

A system that automatically detects seven traffic violations from live feeds (helmetless riders, triple-seat overcrowding, license plates, phone-using drivers, wrong-way drivers, red-light runners, unbelted passengers), references the specific laws each violation breaks, generates e-challans, and seals every detection as tamper-proof evidence on a live enforcement dashboard.

</div>

---

Refer to `docs/capabilities.md` for everything the system is capable of doing.

---
## Local Usage

### Prerequisites

- Python 3.10+
- npm

### Setup

```bash
git clone https://github.com/Eros483/traffic-violation-detection-image-processing.git
cp .env.example .env
make setup
make download-model
make run

# Open http://localhost:8000 in your browser.
```

If make cannot be used, follow setup instructions in `docs/windows-setup.md`.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | For LLM features | Groq API key for optional vision LLM checks (mobile phone, wrong-side driving, red light, seatbelt, stop line, illegal parking) |


**Note**: LLM-assisted violations are **enabled by default** in `configs/config.yaml` (`llm_violations.enabled: true`). Set `GROQ_API_KEY` in `.env` to use them. If you don't have a key, set `enabled: false` in the config — the CV-only pipeline (helmet, triple riding, plate) works without it.

---

### Documentation
- Refer to `docs/research.md` for research-grade items that would bulletproof our solution.
- Refer to `docs/compute_efficiency.md` for information on latency, compute requirements.
- Refer to `docs/production_upgrade.md` on how our team would migrate it for active daily usage at Bengaluru!
- Refer to `docs/extra-setup.md` for assistance in setting up locally, i.e training models from scratch, downloading datasets, etc.
- Refer to `docs/api.md` for information on API endpoints.
- Refer to `docs/design.md` for information on all capabilities and architectural decisions.

---

## Project Structure

```
Traffic Violation Detection Service
├── AGENTS.md                     # Contract with AI Harness
├── api/                          # FastAPI serving and endpoints
├── artifacts/                    # model storage
├── client/                       # dashboard for monitoring violations
├── configs/
├── data/
├── Dockerfile
├── docs/                         # documentation for everything in the repository
├── LICENSE
├── logs/
├── Makefile                      # single builder for everything
├── outputs/
├── public/
├── pyproject.toml
├── README.md
├── src/                          # all controlling scripts
├── tests/
├── utils/
└── uv.lock
```
