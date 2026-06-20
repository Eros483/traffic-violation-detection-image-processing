import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useConsoleData } from "../context/DataContext";
import { createChallan, evidenceImageUrl } from "../lib/api";
import { ISSUING_LOCATION } from "../lib/constants";
import {
  displaySection,
  estimatedFine,
  formatDateTime,
  formatINR,
  pct,
  vehicleLabel,
  violationLabel,
} from "../lib/format";
import { ConfidenceMeter, SectionHeader, SeverityBadge } from "../components/ui";
import { IconChevronLeft, IconImage } from "../components/icons";

const ROW = "flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-2.5 last:border-b-0";
const KEY = "text-xs text-slate-500";
const VAL = "text-right text-[13px] text-slate-900";
const PANEL = "rounded-md border border-slate-200 bg-white";

export function ViolationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { records, loading, reloadChallans } = useConsoleData();

  const record = useMemo(() => records.find((r) => r.violation_id === id) ?? null, [records, id]);
  const [imgError, setImgError] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading case file…</div>;
  }

  if (!record) {
    return (
      <div className="p-6">
        <button onClick={() => navigate("/violations")} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <IconChevronLeft width={15} height={15} /> Back to violations
        </button>
        <div className={`${PANEL} px-6 py-16 text-center`}>
          <div className="text-sm font-semibold text-slate-700">Case not found</div>
          <p className="mt-1 text-sm text-slate-500">No violation matches id <span className="font-mono">{id}</span>.</p>
        </div>
      </div>
    );
  }

  const sections = record.legal_sections.filter((s) => s && s !== "Unknown");
  const fine = estimatedFine(record.violations);

  const issue = async () => {
    setIssuing(true);
    setError(null);
    try {
      const challan = await createChallan({
        violation_id: record.violation_id,
        violations: record.violations.map((v) => ({ type: v.type, confidence: v.confidence })),
        plate_number: record.plate_number,
        vehicle_type: record.vehicle_type,
        location: ISSUING_LOCATION,
        image_hash: record.image_hash,
      });
      reloadChallans();
      navigate(`/challans/${challan.challan_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to issue challan");
      setIssuing(false);
    }
  };

  return (
    <div className="p-6">
      <button onClick={() => navigate("/violations")} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <IconChevronLeft width={15} height={15} /> Back to violations
      </button>

      <div className="grid grid-cols-3 gap-5">
        {/* evidence + violations */}
        <div className="col-span-2 space-y-5">
          <div className={`${PANEL} overflow-hidden`}>
            <SectionHeader title="Evidence" />
            <div className="bg-slate-50 p-4">
              {imgError ? (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded border border-slate-200 bg-white text-slate-400">
                  <IconImage width={28} height={28} />
                  <span className="font-mono text-[11px]">/api/evidence/{record.violation_id.slice(0, 8)}/image</span>
                  <span className="text-xs">Annotated image not available</span>
                </div>
              ) : (
                <img
                  src={evidenceImageUrl(record.violation_id)}
                  alt="Annotated evidence"
                  className="aspect-video w-full rounded border border-slate-200 bg-white object-contain"
                  onError={() => setImgError(true)}
                />
              )}
            </div>
          </div>

          <div className={PANEL}>
            <SectionHeader title="Detected violations" />
            {record.violations.map((v, i) => (
              <div key={`${v.type}-${i}`} className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0">
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">{violationLabel(v.type)}</div>
                  {v.description && <div className="text-xs text-slate-500">{v.description}</div>}
                </div>
                <ConfidenceMeter value={v.confidence} />
              </div>
            ))}
          </div>
        </div>

        {/* case file + action */}
        <div className="space-y-5">
          <div className={PANEL}>
            <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <div className="font-mono text-[11px] text-slate-500">{record.violation_id}</div>
                <div className="mt-0.5 font-mono text-lg font-semibold tracking-wide text-slate-900">
                  {record.plate_number ?? "PLATE UNREAD"}
                </div>
              </div>
              <span className="ml-auto">
                <SeverityBadge severity={record.severity} />
              </span>
            </div>
            <dl>
              <div className={ROW}>
                <dt className={KEY}>Captured</dt>
                <dd className={`${VAL} tnum`}>{formatDateTime(record.timestamp)}</dd>
              </div>
              <div className={ROW}>
                <dt className={KEY}>Vehicle</dt>
                <dd className={VAL}>{vehicleLabel(record.vehicle_type)}</dd>
              </div>
              <div className={ROW}>
                <dt className={KEY}>Plate read</dt>
                <dd className={VAL}>
                  {record.plate_number ? (
                    <span className="font-mono">{record.plate_number} · {pct(record.plate_confidence)}</span>
                  ) : (
                    <span className="text-slate-500">Not recognised</span>
                  )}
                </dd>
              </div>
              <div className={ROW}>
                <dt className={KEY}>Legal sections</dt>
                <dd className={VAL}>{sections.map(displaySection).join(", ") || "—"}</dd>
              </div>
              <div className={ROW}>
                <dt className={KEY}>Vehicle box</dt>
                <dd className={`${VAL} font-mono text-xs`}>{record.vehicle_bbox ? `[${record.vehicle_bbox.join(", ")}]` : "image-level"}</dd>
              </div>
              <div className={ROW}>
                <dt className={KEY}>Source image</dt>
                <dd className={`${VAL} break-all font-mono text-[11px]`}>{record.image_path}</dd>
              </div>
              <div className={ROW}>
                <dt className={KEY}>SHA-256</dt>
                <dd className={`${VAL} break-all font-mono text-[11px]`}>{record.image_hash}</dd>
              </div>
            </dl>
          </div>

          <div className={`${PANEL} p-4`}>
            {error && (
              <div className="mb-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Estimated fine
                <div className="tnum text-base font-semibold text-slate-900">{formatINR(fine)}</div>
              </div>
              <button
                onClick={issue}
                disabled={issuing}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-[#fff] hover:bg-blue-800 disabled:opacity-60"
              >
                {issuing ? "Issuing…" : "Issue Challan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
