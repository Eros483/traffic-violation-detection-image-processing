import { useMemo } from "react";
import { fetchAllChallans, fetchAllViolations, fetchMetrics } from "../lib/api";
import { computeAnalytics } from "../lib/derive";
import type { Analytics } from "../lib/derive";
import { useFetch } from "./useFetch";
import type { ChallanRecord, ModelMetrics, ViolationRecord } from "../types";

interface ViolationsBundle {
  records: ViolationRecord[];
  metrics: ModelMetrics | null;
}

export interface ViolationsData {
  records: ViolationRecord[];
  analytics: Analytics;
  metrics: ModelMetrics | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useViolationsData(): ViolationsData {
  const { data, loading, error, reload } = useFetch<ViolationsBundle>(
    async (signal) => {
      const [records, metrics] = await Promise.all([
        fetchAllViolations(signal),
        fetchMetrics(signal),
      ]);
      return { records, metrics };
    },
    [],
  );

  const records = useMemo(() => data?.records ?? [], [data]);
  const analytics = useMemo(() => computeAnalytics(records), [records]);
  return { records, analytics, metrics: data?.metrics ?? null, loading, error, reload };
}

export interface ChallansData {
  challans: ChallanRecord[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useChallans(): ChallansData {
  const { data, loading, error, reload } = useFetch<ChallanRecord[]>(
    async (signal) => {
      const items = await fetchAllChallans(signal);
      // Newest first.
      return [...items].sort((a, b) => b.issued_at.localeCompare(a.issued_at));
    },
    [],
  );
  return { challans: data ?? [], loading, error, reload };
}
