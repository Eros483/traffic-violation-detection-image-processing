// Data hooks over the live API. The console reads from the backend directly —
// no bundled mock. Each hook tracks loading and error so views can render
// honest loading / empty / error states.

import { useEffect, useMemo, useState } from "react";
import { fetchAllChallans, fetchAllViolations, fetchMetrics } from "../lib/api";
import { computeAnalytics, type Analytics } from "../lib/analytics";
import type { Challan, ModelMetrics, ViolationRecord } from "../lib/types";

interface ViolationsState {
  records: ViolationRecord[];
  analytics: Analytics;
  metrics: ModelMetrics | null;
  loading: boolean;
  error: string | null;
}

export function useViolationsData(): ViolationsState {
  const [records, setRecords] = useState<ViolationRecord[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [recs, mx] = await Promise.all([
          fetchAllViolations(ctrl.signal),
          fetchMetrics(ctrl.signal),
        ]);
        if (!alive) return;
        setRecords(recs);
        setMetrics(mx);
      } catch (e) {
        if (!alive || ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to reach the API");
        setRecords([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, []);

  const analytics = useMemo(() => computeAnalytics(records), [records]);
  return { records, analytics, metrics, loading, error };
}

interface ChallansState {
  challans: Challan[];
  loading: boolean;
  error: string | null;
}

export function useChallans(reloadKey: number): ChallansState {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;
    setLoading(true);
    setError(null);

    fetchAllChallans(ctrl.signal)
      .then((items) => {
        if (!alive) return;
        // Newest first.
        items.sort((a, b) => b.issued_at.localeCompare(a.issued_at));
        setChallans(items);
      })
      .catch((e) => {
        if (!alive || ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to reach the API");
        setChallans([]);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [reloadKey]);

  return { challans, loading, error };
}
