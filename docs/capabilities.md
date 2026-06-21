## 1. Core Detection & AI Capabilities

The platform utilizes a multi-stage, CPU-optimized machine learning pipeline to process images and identify infractions.

* **Image Preprocessing:** Applies Contrast Limited Adaptive Histogram Equalization (CLAHE) for low-light enhancement (activating for luminance thresholds < 60) to improve detection accuracy.
* **Helmet & Rider Detection:** Utilizes a fine-tuned YOLOv8m model to detect riders with helmets, without helmets, and license plates.
* **Triple Riding Detection:** Employs YOLOv8-Pose for occupant counting within dynamically padded vehicle bounding boxes.
* **License Plate Recognition (LPR):** Integrates RapidOCR (rapidocr-onnxruntime) combined with formatting validation and OCR confusion correction, specifically tuned for Karnataka (KA) format plates.
* **LLM-Assisted Classification:** Features an optional integration with the Groq vision LLM (`meta-llama/llama-4-scout-17b-16e-instruct`) to classify complex secondary violations, including mobile phone usage, wrong-side driving, red-light running, seatbelt non-compliance, stop-line crossing, and illegal parking.

## 2. Backend & Processing Infrastructure

The backend is driven by a high-performance Python API designed for stateless processing and evidence integrity.


* **Cryptographic Evidence Packaging:** Automatically compiles the annotated detection image, JSON metadata, and mapped legal sections (e.g., Section 194B, 119/177) into a consolidated package secured by a SHA-256 hash.
* **Automated Challan Generation:** Allows seamless conversion of confirmed violations into e-tickets (challans) with automated fine computation based on local legal mappings.
* **Hardware-Optimized Inference:** Operates on native `.pt` YOLO weights and a CPU-only PyTorch index, drastically reducing framework overhead and memory consumption (removing CUDA/NVIDIA dependencies).

## 3. Frontend & User Experience

The client-facing application is a responsive, single-page application built with React, Vite, TypeScript and Tailwind.

* **Live Detection Dashboard:** Provides a manual testing interface where users can upload images, run the full AI pipeline in real-time, view annotated visual results, and generate a challan instantly.
* **Analytics & KPI Dashboard:** Displays real-time operational metrics, including KPI cards, violation trend charts, and a recent activity feed.

## 4. Analytics & Evaluation Metrics

The system includes built-in tools for measuring both operational data and system performance.

| Capability Area | Specific Features |
| :--- | :--- |
| **Operational Analytics** | Trend tracking via Recharts, pie charts for violation type breakdowns, and top offender rankings. |
| **Model Evaluation** | Precision, recall, and F1 score tracking, alongside LPR character and plate-level accuracy metrics. |
| **System Benchmarking** | Detailed tracking of wall-clock time per pipeline stage, throughput (images/sec), and peak memory usage via `psutil`. |

## 5. DevOps & Deployment Architecture

The service is deployed on **AWS Elastic Beanstalk** using a `t3.micro` instance (1 vCPU, 1 GB RAM), with a live demo available at [traffic-violation-api.eba-7aat7qza.ap-south-1.elasticbeanstalk.com](http://traffic-violation-api.eba-7aat7qza.ap-south-1.elasticbeanstalk.com/#/).

* **Unified Serving:** The FastAPI backend automatically mounts and serves the built React frontend static files (`client/dist/`) at the root, enabling same-origin serving from a single process.
* **Swap-Backed Memory:** An `.ebextensions/01-swap.config` hook provisions a 1 GB swap file on instance boot, preventing out-of-memory kills during model weight loading on the memory-constrained `t3.micro`.
* **Lean Dockerization:** A multi-stage Dockerfile builds the React frontend in a Node image and the Python runtime in a `python:3.12-slim` base. Environment tuning (`OMP_NUM_THREADS=1`, `MALLOC_ARENA_MAX=2`, `MALLOC_TRIM_THRESHOLD_=131072`, `PYTHONMALLOC=malloc`) minimizes thread overhead and memory fragmentation for single-worker CPU inference.
* **Continuous Integration:** GitHub Actions (`ci.yml`) runs backend formatting checks (`black --check`), `pytest`, frontend TypeScript type-checking, and production build validation on every push and pull request to `main`.