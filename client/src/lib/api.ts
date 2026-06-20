// Typed client for the FastAPI backend. Covers exactly what the backend
// exposes — read endpoints, challan creation, and image upload. VITE_API_BASE
// may set an absolute origin; when empty (the default), requests are relative
// and ride either same-origin serving or the Vite dev proxy.

import type {
  AnalyticsSummary,
  ChallanRecord,
  ChallanRequest,
  HealthResponse,
  ModelMetrics,
  PaginatedChallans,
  PaginatedViolations,
  UploadResult,
  ViolationRecord,
} from "../types";

const BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" }, signal });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/** Pages through a paginated endpoint until the full set is loaded (capped). */
async function fetchAllPages<T>(
  path: (page: number, size: number) => string,
  signal: AbortSignal | undefined,
  pick: (r: { items: T[]; total: number }) => T[],
  pageSize: number,
  maxRecords: number,
): Promise<T[]> {
  const first = await getJSON<{ items: T[]; total: number }>(path(1, pageSize), signal);
  const items = [...pick(first)];
  const want = Math.min(first.total, maxRecords);
  let page = 2;
  while (items.length < want) {
    const next = await getJSON<{ items: T[]; total: number }>(path(page, pageSize), signal);
    const batch = pick(next);
    if (!batch.length) break;
    items.push(...batch);
    page += 1;
  }
  return items;
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return getJSON<HealthResponse>("/health", signal);
}

export async function fetchAllViolations(
  signal?: AbortSignal,
  pageSize = 200,
  maxRecords = 5000,
): Promise<ViolationRecord[]> {
  return fetchAllPages<ViolationRecord>(
    (p, s) => `/api/violations?page=${p}&page_size=${s}`,
    signal,
    (r) => (r as PaginatedViolations).items,
    pageSize,
    maxRecords,
  );
}

export async function fetchSummary(signal?: AbortSignal): Promise<AnalyticsSummary> {
  return getJSON<AnalyticsSummary>("/api/analytics/summary", signal);
}

/** Metrics may legitimately 404 before `make evaluate` runs — caller handles null. */
export async function fetchMetrics(signal?: AbortSignal): Promise<ModelMetrics | null> {
  try {
    return await getJSON<ModelMetrics>("/api/analytics/metrics", signal);
  } catch {
    return null;
  }
}

export async function fetchAllChallans(
  signal?: AbortSignal,
  pageSize = 200,
  maxRecords = 5000,
): Promise<ChallanRecord[]> {
  return fetchAllPages<ChallanRecord>(
    (p, s) => `/api/challans?page=${p}&page_size=${s}`,
    signal,
    (r) => (r as PaginatedChallans).items,
    pageSize,
    maxRecords,
  );
}

export async function createChallan(body: ChallanRequest): Promise<ChallanRecord> {
  const res = await fetch(`${BASE}/api/challans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Challan creation failed: ${res.status}`);
  return (await res.json()) as ChallanRecord;
}

/** Uploads an image to POST /api/violations/upload and returns pipeline results. */
export async function uploadImage(file: File, signal?: AbortSignal): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/violations/upload`, {
    method: "POST",
    body: form,
    signal,
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* non-JSON error body — keep the status line */
    }
    throw new Error(detail);
  }
  return (await res.json()) as UploadResult;
}

/** Direct URL for the annotated evidence image (may 404 → handle in <img>). */
export function evidenceImageUrl(violationId: string): string {
  return `${BASE}/api/evidence/${violationId}/image`;
}
