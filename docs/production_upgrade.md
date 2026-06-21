# Changes I would make for production as a real system

## 1. Architecture Evolution

### Current (Prototype)
```
Camera image → preprocessing → YOLO → OCR → evidence → JSONL file
                    ↓
              FastAPI ← reads JSONL
                    ↓
              React dashboard
```

### Target (Production)
```
RTSP streams → frame grabber → preprocessing → message queue (RabbitMQ/Kafka)
                                                       ↓
                                            worker pool (GPU)
                                                       ↓
                          ┌──────────────────────────────┼──────────────────────┐
                          ↓                              ↓                      ↓
                  detection pipeline              LLM enrichment        evidence store
                    (YOLO + OCR)                   (async, low pri)        (PostgreSQL)
                          ↓                              ↓                      ↓
                    violation DB ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←                ↓
                          ↓                                                      ↓
                    REST API ← serves dashboard + third-party integrations
                          ↓
              monitoring / alerting / audit log
```

## 2. Infrastructure Components

### 2.1 Camera Ingestion

| Component | Recommendation | Rationale |
|---|---|---|
| Frame grabber | FFmpeg / GStreamer wrapper | Mature, battle-tested, supports RTSP/HLS |
| Sampling rate | 1–5 fps per camera | Traffic changes slowly; 30fps is wasteful |
| Edge processing | Jetson Orin / Raspberry Pi 5 | Run lightweight YOLO at camera; send only crops to central server |

### 2.2 Message Queue

| Option | When to choose |
|---|---|
| **RabbitMQ** | <10k msg/s, need DLQ + routing |
| **Apache Kafka** | >10k msg/s, need replay + long retention |
| **Redis Streams** | Simple setup, already in stack for caching |

The queue decouples ingestion from processing — cameras never block on pipeline latency.

### 2.3 Worker Pool

- **Orchestration**: Celery (Python) or Argo Workflows (Kubernetes)
- **Auto-scaling**: workers scale on queue depth (KEDA for K8s, Celery autoscaler for VMs)
- **GPU sharing**: MIG (NVIDIA A100) or time-slicing for smaller GPUs
- **Cold start**: workers pre-load model weights at boot; inference is the only hot path

### 2.4 Database

| Need | Current | Production |
|---|---|---|
| Violation records | `outputs/violations.jsonl` | **PostgreSQL** with JSONB for flexible violation schemas |
| Image/evidence storage | Local filesystem | **S3-compatible** (MinIO / AWS S3) with presigned URLs |
| Caching | None | **Redis** for analytics aggregations, hot records |
| Search | grep + pagination | **Elasticsearch** for full-text plate search + filtering |

### 2.5 Image / Evidence Storage

- **Immutable objects**: images are written once, never modified
- **Lifecycle policy**: hot storage for 30 days → cold (Glacier/Deep Archive) for 1 year
- **Annotated vs raw**: store both; annotated for dashboard, raw for re-processing with updated model

## 3. Model Pipeline Improvements

### 3.1 Model Serving

| Current | Production |
|---|---|
| `YOLO("best.pt")` | **NVIDIA Triton Inference Server** or **TorchServe** |
| Reloads model on restart | Continuous serving with model versioning |
| Single model per process | Multi-model ensemble (detector + pose + OCR) on one GPU |

### 3.2 Model Versioning & A/B Testing

```yaml
# Model registry (DVC / MLflow / S3)
models/v1/best.pt      # production
models/v2/best.pt      # staging — shadow-traffic 5%
models/v3/best.pt      # dev — manual invoke only

# Shadow deployment: send 5% of live traffic to v2 without enforcing results
# Compare precision/recall offline before cut-over
```

### 3.3 Periodic Re-training

- **Trigger**: weekly or when production precision drops >2% against a holdout set
- **Data accumulation**: store detected plates and LLM-confirmed violations as pseudo-labels
- **Active learning pipeline**: flag low-confidence detections for human review → add to training set
- **Federated learning** (future): edge devices train on local data without uploading raw images

### 3.4 OCR Upgrades

| Current | Production |
|---|---|
| RapidOCR (ONNX-based) | **PaddleOCR serving** or **TrOCR** (transformer-based for better accuracy) |
| Single image per call | Batch inference where possible |
| KA-only validation | Extend to all 36 Indian state codes + UT codes |

## 4. Real-Time Pipeline

### 4.1 Current Limitation
~700 ms/image on CPU → 1.43 img/s. A typical city junction with 4 cameras at 2 fps = 8 img/s.

### 4.2 GPU Solution
Single T4 GPU: ~250 ms/image (YOLO: 22ms, OCR: ~200ms, rest: negligible) → 4 img/s.
Scale: 2 GPUs → 8 img/s, 4 GPUs → 16 img/s.

### 4.3 Edge + Cloud Hybrid

```
Camera → Edge (Jetson): YOLO detection + crop extraction → Cloud: OCR + evidence → DB
```

- Edge handles the heavy YOLO inference locally (15-30ms on Jetson Orin)
- Only plate crops (~10KB) and metadata are sent to cloud — 100× bandwidth reduction
- Cloud runs OCR + LLM enrichment asynchronously

### 4.4 Processing Tier Architecture

```yaml
tiers:
  tier_1:  # <5 min latency
    violations: [helmet, triple_riding, seatbelt]
    priority: high
    workers: GPU pool (hot)

  tier_2:  # <1 hour latency
    violations: [wrong_side, red_light, stop_line]
    priority: medium
    workers: CPU pool (cost-optimised)

  tier_3:  # daily batch
    violations: [illegal_parking, mobile_phone]
    priority: low
    workers: spot instances / preemptible VMs
```

## 5. Observability

### 5.1 Metrics

Track via Prometheus

### 5.2 Logging (Structured)

Ship to **ELK / Loki + Grafana** for dashboarding and alerting.

### 5.3 Dashboards (Grafana)

- **Real-time Ops**: queue depth, throughput, per-stage latency, error rate (P50/P95/P99)
- **Business**: violation trends by hour/day/week, top camera hotspots, plate repeat offenders
- **Model Health**: confidence distribution, mAP drift, data distribution shift

### 5.4 Alerting Rules

| Condition | Severity | Action |
|---|---|---|
| Queue depth > 10,000 for 5 min | Critical | Auto-scale workers |
| P95 latency > 2 s for 5 min | Warning | Page on-call |
| Detection rate drop > 20% in 1 hour | Critical | Investigate model / camera |
| Error rate > 5% for 5 min | Critical | Rollback deployment |
| Precision drop > 2% (weekly) | Warning | Schedule re-training |

## 6. CI/CD & MLOps

### 6.1 Pipeline

```
PR → lint + test + typecheck → build Docker → deploy to staging → shadow test → deploy to prod (canary)
                                                                                      ↓
                                                                              monitor 30 min
                                                                                      ↓
                                                                              rollback on metrics regression
```

### 6.2 Model CI

```
New training run → evaluate on holdout → if mAP > previous: tag & push to model registry
                                                          ↓
                                           update deployment config → restart workers (rolling)
```

### 6.3 Data Drift Monitoring

- **Input drift**: image brightness, contrast, resolution histogram shift
- **Prediction drift**: class distribution shift (e.g., suddenly 80% "no helmet" vs historical 30%)
- **Action**: auto-trigger re-training when drift exceeds thresholds

## 7. Security & Compliance

| Area | Requirement |
|---|---|
| **Data privacy** | Images are PII (contains faces, license plates). Encrypt at rest (AES-256) and in transit (TLS 1.3). Retention: 30 days live, 1 year cold, then delete. |
| **Access control** | RBAC: operator (view violations), admin (manage cameras/config), auditor (read-only all data including deleted records) |
| **Audit trail** | Every DB write is logged with actor, action, timestamp, old/new values |
| **API auth** | JWT with short expiry; API keys for third-party integrations |
| **Court-grade evidence** | SHA-256 hash stored with every violation. Chain of custody: signed timestamps, checksum verification endpoint. Tamper-evident log (append-only) for critical records. |
| **GDPR / DPDP** | Right to erasure: delete image + associated records within 30 days of request. Data minimisation: blur faces and bystander plates in published evidence images. |

## 8. Scaling Cost Estimates (for a mid-size Indian city)

Assume 500 cameras, 2 fps each = 1,000 img/s, 30% peak idle.

| Component | Monthly Cost (INR, approx) |
|---|---|
| 8× NVIDIA T4 GPUs (cloud) | ₹1,20,000 |
| PostgreSQL (managed, 100 GB) | ₹10,000 |
| S3 storage (50 TB/month) | ₹15,000 |
| Message queue (Kafka managed) | ₹25,000 |
| LLM API (Groq free tier → paid) | ₹5,000 |
| Networking + CDN | ₹10,000 |
| **Total** | **~₹1,85,000/month** |

Alternative: procure on-prem GPUs + manage PostgreSQL → ~₹60,000/month (OpEx) + ₹15L (CapEx) for 4× A5000.
