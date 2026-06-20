// Root composition: shell, view routing, live data wiring, and the case-file
// drawer. Issuing a challan bumps the challans reload key so the register
// refreshes from the backend.

import { useState } from "react";
import { Sidebar, type View } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { CaseDrawer } from "./components/CaseDrawer";
import { useChallans, useViolationsData } from "./hooks/useData";
import { Overview } from "./pages/Overview";
import { Violations } from "./pages/Violations";
import { Challans } from "./pages/Challans";

export type ConnState = "ok" | "down" | "loading";

const TITLES: Record<View, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Operational summary & model performance" },
  violations: { title: "Violations", subtitle: "Automated detection log" },
  challans: { title: "Challans", subtitle: "Issued challan register" },
};

export default function App() {
  const [view, setView] = useState<View>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [challanReload, setChallanReload] = useState(0);

  const { records, analytics, metrics, loading, error } = useViolationsData();
  const { challans, loading: clLoading, error: clError } = useChallans(challanReload);

  const conn: ConnState = error ? "down" : loading ? "loading" : "ok";
  const { title, subtitle } = TITLES[view];
  const selected = records.find((r) => r.violation_id === selectedId) ?? null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        view={view}
        onNavigate={setView}
        counts={{ violations: analytics.total, challans: challans.length }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} subtitle={subtitle} conn={conn} />
        <main className="flex-1 overflow-y-auto">
          {view === "overview" && (
            <Overview analytics={analytics} metrics={metrics} loading={loading} error={error} />
          )}
          {view === "violations" && (
            <Violations
              records={records}
              loading={loading}
              error={error}
              selectedId={selectedId}
              onSelect={(r) => setSelectedId(r.violation_id)}
            />
          )}
          {view === "challans" && (
            <Challans challans={challans} loading={clLoading} error={clError} />
          )}
        </main>
      </div>

      <CaseDrawer
        record={selected}
        onClose={() => setSelectedId(null)}
        onIssued={() => setChallanReload((n) => n + 1)}
      />
    </div>
  );
}
