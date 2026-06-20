// Typed client for the FastAPI backend. Read endpoints plus challan creation —
// nothing the backend doesn't expose. VITE_API_BASE may set an absolute origin;
// when empty, requests are relative and ride the Vite dev proxy.

import type {
  AnalyticsSummary,
  Challan,
  ChallanRequest,
  HealthResponse,
  ModelMetrics,
  PaginatedChallans,
  PaginatedViolations,
  ViolationRecord,
} from "./types";

const BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return getJSON<HealthResponse>("/health", signal);
}

/** Pages through GET /api/violations until the full set is loaded (capped). */
export async function fetchAllViolations(
  signal?: AbortSignal,
  pageSize = 200,
  maxRecords = 5000,
): Promise<ViolationRecord[]> {
  const first = await getJSON<PaginatedViolations>(
    `/api/violations?page=1&page_size=${pageSize}`,
    signal,
  );
  const items = [...first.items];
  const want = Math.min(first.total, maxRecords);
  let page = 2;
  while (items.length < want) {
    const next = await getJSON<PaginatedViolations>(
      `/api/violations?page=${page}&page_size=${pageSize}`,
      signal,
    );
    if (!next.items.length) break;
    items.push(...next.items);
    page += 1;
  }
  return items;
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
): Promise<Challan[]> {
  const first = await getJSON<PaginatedChallans>(
    `/api/challans?page=1&page_size=${pageSize}`,
    signal,
  );
  const items = [...first.items];
  const want = Math.min(first.total, maxRecords);
  let page = 2;
  while (items.length < want) {
    const next = await getJSON<PaginatedChallans>(
      `/api/challans?page=${page}&page_size=${pageSize}`,
      signal,
    );
    if (!next.items.length) break;
    items.push(...next.items);
    page += 1;
  }
  return items;
}

export async function createChallan(body: ChallanRequest): Promise<Challan> {
  const res = await fetch(`${BASE}/api/challans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Challan creation failed: ${res.status}`);
  return (await res.json()) as Challan;
}

/** Direct URL for the annotated evidence image (may 404 → handle in <img>). */
export function evidenceImageUrl(violationId: string): string {
  return `${BASE}/api/evidence/${violationId}/image`;
}
