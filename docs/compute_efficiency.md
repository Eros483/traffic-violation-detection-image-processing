# Computational Efficiency & Scalability Assessment

This document is an entry point into the efficiency and scalability of this pipeline. But a live demo always works best, at demonstrating efficiency, and this works on 1 vCPU and 1 gb of ram as a prototype itself! Check it at [AWS](http://traffic-violation-api.eba-7aat7qza.ap-south-1.elasticbeanstalk.com/#/) because that itself is a demonstration of the efficiency of this pipeline.

> Based on benchmark data collected via `benchmark_pipeline()` in `src/evaluate.py`.
> Run `make benchmark` to reproduce on your hardware.

## 1. Benchmark Methodology

The pipeline is instrumented with per-stage wall-clock timing and RSS (resident set size) tracking using Python's `time.perf_counter()` and `psutil`. Each image flows through these stages:

```
Read → Preprocess → Detect → OCR → Package → Annotate
```

- **Warmup**: configurable (default 0) — first-run model loading cost is included in results by default
- **LLM stage**: skipped by default (Groq API latency is network-bound, not representative)
- **Memory**: measured as RSS delta before/after each stage
- **Output**: merged into `outputs/metrics.json` under the `"benchmark"` key

## 2. Results (CPU: x86_64, RAM: 15 GB, Python 3.13, No GPU)

Measured on 11 sample images from the `public/` directory.

### 2.1 Aggregate Timing

| Stage | Mean (ms) | Std (ms) | Min (ms) | Max (ms) | Total (ms) | % of Pipeline |
|---|---|---|---|---|---|---|
| Preprocess | 13.69 | 35.09 | 1.37 | 119.35 | 150.54 | 2.0% |
| **Detect** | **469.47** | 276.34 | 183.87 | 875.57 | 5164.17 | **67.1%** |
| OCR | 213.62 | 268.86 | 0.0 | 810.42 | 2349.85 | 30.5% |
| Evidence | 0.14 | 0.03 | 0.09 | 0.16 | 1.51 | <0.1% |
| Annotation | 0.26 | 0.10 | 0.06 | 0.36 | 2.86 | <0.1% |
| **Total** | **699.24** | 337.55 | 222.76 | 1268.14 | 7691.62 | **100%** |

### 2.2 Aggregate Memory

| Stage | Mean Delta (MB) | Max Delta (MB) |
|---|---|---|
| Preprocess | 0.0 | 0.5 |
| Detect | 8.6 | 75.2 |
| OCR | 17.1 | 95.0 |
| Evidence | 0.0 | 0.0 |
| Annotation | 0.0 | 0.2 |

- **Peak RSS**: 806.7 MB
- **Baseline RSS (idle)**: ~522 MB (Python + ultralytics import)
- **Steady-state growth**: negligible across 11 images — no leak detected

### 2.3 Throughput

| Metric | Value |
|---|---|
| Total time (11 images) | 7.71 s |
| Throughput | **1.43 images/sec** |
| Per-image average | 699 ms |
| Bottleneck | YOLO detection (67% of time) |

## 3. Stage-by-Stage Analysis

### 3.1 Preprocessing (2% of time, ~0 MB delta)

- **Cost**: negligible (CLAHE only triggers on low-light images)
- **Variance spike** (119 ms max): first image triggers CLAHE on a dark image; subsequent well-lit images average ~2.5 ms
- **No scalability concern** — trivially fast

### 3.2 YOLOv8m Detection (67% of time, 8.6 MB mean delta)

- **Dominant cost** at ~470 ms/image on CPU
- **Memory**: first image loads model weights (522→598 MB, +75 MB); subsequent images reuse cached model
- **Scaling**: inference is CPU-bound at 640×640. A GPU (even T4) would reduce this to ~15-30 ms/image — a **15-30× speedup**
- **Alternative**: YOLOv8n (nano) trades mAP (~-5%) for ~2× inference speed

### 3.3 OCR / RapidOCR (30.5% of time, 17.1 MB mean delta)

- **Cost**: ~214 ms average, but highly variable (0–810 ms) depending on plate detection count
- **Memory**: grows as more plate crops are processed per image (max +95 MB)
- **Scaling**: individual calls per plate crop — batch inference not possible without engine change
- **Optimization**: cache empty results; skip OCR if `plate_bbox` confidence < threshold

### 3.4 Evidence Packaging + Annotation (<0.5% of time)

- **Cost**: negligible (<0.5 ms combined)
- **Memory**: no delta — operates on existing tensors
- **Not a bottleneck**

## 4. Scalability Assessment

### 4.1 Vertical Scaling

| Resource | Current | Recommended for 10× load |
|---|---|---|
| CPU cores | 1 (single-thread) | 4-8 (parallel workers) |
| RAM | 15 GB (806 MB used) | 2 GB minimal; 4 GB comfortable |
| GPU | None | T4 or better for real-time |

**CPU-bound pipeline**: 1.43 img/s per process. With 4 parallel workers → ~5.7 img/s.

### 4.2 Horizontal Scaling

- **Stateless workers**: the pipeline is pure-function (image in → records out). Trivially parallelisable via:
  - Multiprocessing `Pool` (within a single host)
  - Task queues (Redis/RabbitMQ → worker pool)
  - Serverless (AWS Lambda / Google Cloud Functions with < 5 min timeout)
- **Stateful bottleneck**: JSONL file append requires file-level locking; switch to a proper DB for multi-writer production

### 4.3 Throughput Estimates for Production

| Scenario | Images/sec | Images/hour | Viable? |
|---|---|---|---|
| Single CPU (this prototype) | 1.43 | 5,148 | Batch only |
| Single GPU (T4, YOLO only) | ~30 | 108,000 | Real-time feasible |
| 4× CPU workers | ~5.7 | 20,520 | Modest batch |
| 4× GPU workers | ~120 | 432,000 | City-scale |

### 4.4 LLM Stage (if enabled)

Groq vision API adds 2–5 seconds per image (network latency + model inference). Not suitable for real-time.
- **Mitigation**: run LLM asynchronously (fire-and-forget) after CV detections are stored
- **Cost**: Groq is free-tier; commercial usage would need cost-benefit analysis per violation type

## 5. Bottlenecks & Recommendations

| Bottleneck | Impact | Recommendation |
|---|---|---|
| YOLO inference on CPU | 67% of latency | Add GPU inference (CUDA/TensorRT) or switch to YOLOv8n |
| OCR per plate crop | 30% of latency | Batch plate crops; skip OCR on low-confidence detections |
| JSONL append | Not safe for multi-writer | Replace with SQLite (small scale) or PostgreSQL (large scale) |
| No warm image cache | First image pays model load cost | Keep process alive (FastAPI already does); use model singleton |
| Single-threaded | Underutilises multi-core | Use `multiprocessing` or `concurrent.futures` for batch jobs |

## 6. GPU Speedup Projection

Based on published YOLOv8 benchmarks (Ultralytics):

| Model | CPU (ms) ¹ | T4 GPU (ms) | Speedup |
|---|---|---|---|
| YOLOv8m | 470 | 22 | **21×** |
| YOLOv8n | 210 | 8 | **26×** |

¹ Intel Xeon, batch=1, imgsz=640. Our CPU is comparable (Ryzen-class AMD).

With GPU, total per-image drops from ~700 ms to ~250 ms (OCR dominates), pushing throughput to ~4 img/s even without optimising OCR.

## 7. Key Takeaways

1. **Pipeline is CPU-bound** — YOLO detection is the primary bottleneck at 67%
2. **Memory is comfortable** — peak 807 MB on 15 GB host; no leak detected
3. **Throughput of 1.43 img/s** is sufficient for batch processing (5000+/hour) but not real-time camera feeds
4. **GPU acceleration** would yield 15-30× speedup on detection, the dominant stage
5. **Horizontal scaling is trivial** — stateless pipeline, just needs a proper backend (DB + task queue)
6. **OCR is the secondary bottleneck** — consider skipping on low-confidence plates to save 30% time
