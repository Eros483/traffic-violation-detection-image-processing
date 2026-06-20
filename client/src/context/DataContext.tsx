// Single source of live data for the whole console. Violations + metrics +
// challans are fetched once here and shared via context, so the sidebar counts,
// the navbar connection state, and every page read the same snapshot without
// duplicate requests. `reloadChallans` lets the case file refresh the register
// after issuing a challan without re-pulling the full violation log.

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useChallans, useViolationsData } from "../hooks/useData";
import type { Analytics } from "../lib/derive";
import type { ChallanRecord, ModelMetrics, ViolationRecord } from "../types";

interface ConsoleData {
  records: ViolationRecord[];
  analytics: Analytics;
  metrics: ModelMetrics | null;
  challans: ChallanRecord[];
  loading: boolean; // violations/metrics still loading
  error: string | null; // violations/metrics error
  challansLoading: boolean;
  challansError: string | null;
  reloadViolations: () => void;
  reloadChallans: () => void;
}

const Ctx = createContext<ConsoleData | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const v = useViolationsData();
  const c = useChallans();

  const value = useMemo<ConsoleData>(
    () => ({
      records: v.records,
      analytics: v.analytics,
      metrics: v.metrics,
      challans: c.challans,
      loading: v.loading,
      error: v.error,
      challansLoading: c.loading,
      challansError: c.error,
      reloadViolations: v.reload,
      reloadChallans: c.reload,
    }),
    [v.records, v.analytics, v.metrics, v.loading, v.error, v.reload, c.challans, c.loading, c.error, c.reload],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConsoleData(): ConsoleData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConsoleData must be used within a DataProvider");
  return ctx;
}
