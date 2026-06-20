import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import type { ConnState } from "../components/Navbar";
import { PageTransition } from "../components/PageTransition";
import { Sidebar } from "../components/Sidebar";
import { useConsoleData } from "../context/DataContext";

interface PageMeta {
  title: string;
  subtitle: string;
}

function metaForPath(pathname: string): PageMeta {
  if (pathname === "/") return { title: "Dashboard", subtitle: "Operational summary & model performance" };
  if (pathname.startsWith("/analytics")) return { title: "Analytics", subtitle: "Trends, breakdowns & repeat offenders" };
  if (pathname.startsWith("/violations")) return { title: "Violations", subtitle: "Automated detection log" };
  if (pathname.startsWith("/challans")) return { title: "Challans", subtitle: "Issued challan register" };
  if (pathname.startsWith("/live")) return { title: "Live Detection", subtitle: "Run the pipeline on an uploaded image" };
  if (pathname.startsWith("/settings")) return { title: "Settings", subtitle: "Appearance & about" };
  return { title: "Not found", subtitle: "" };
}

export function AppLayout() {
  const { pathname } = useLocation();
  const { analytics, challans, loading, error } = useConsoleData();

  const meta = metaForPath(pathname);
  const conn: ConnState = error ? "down" : loading ? "loading" : "ok";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar counts={{ violations: analytics.total, challans: challans.length }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar title={meta.title} subtitle={meta.subtitle} conn={conn} />
        <main className="flex-1 overflow-y-auto">
          <PageTransition pathname={pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
