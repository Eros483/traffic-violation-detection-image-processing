import type { ReactNode } from "react";
import { IconAlert } from "../icons";

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      {label}
    </div>
  );
}

export function EmptyState({ title, text, icon }: { title: string; text: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      {icon && <div className="text-slate-300">{icon}</div>}
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      <p className="max-w-md text-sm text-slate-500">{text}</p>
    </div>
  );
}

interface AsyncBoundaryProps {
  loading: boolean;
  error: string | null;
  /** True when not loading, no error, but the result set is empty. */
  empty?: boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyText?: string;
  emptyIcon?: ReactNode;
  children: ReactNode;
}

export function AsyncBoundary({
  loading,
  error,
  empty = false,
  loadingLabel = "Loading…",
  emptyTitle = "Nothing to show",
  emptyText = "There are no records for the current view.",
  emptyIcon,
  children,
}: AsyncBoundaryProps) {
  if (loading) return <Spinner label={loadingLabel} />;
  if (error)
    return (
      <EmptyState
        title="Can't reach the detection API"
        text="Start the backend with `make run-api`. The console reads live from the FastAPI service."
        icon={<IconAlert width={32} height={32} />}
      />
    );
  if (empty) return <EmptyState title={emptyTitle} text={emptyText} icon={emptyIcon} />;
  return <>{children}</>;
}
