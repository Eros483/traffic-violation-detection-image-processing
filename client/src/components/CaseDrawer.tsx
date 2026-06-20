// Case file for one violation: evidence image (graceful 404), every persisted
// field, and the issue-challan action (POST /api/challans). On success the
// returned challan — id, fine, sections — is shown inline.

import { useEffect, useState } from "react";
import { createChallan, evidenceImageUrl } from "../lib/api";
import {
  displaySection,
  estimatedFine,
  formatDateTime,
  formatINR,
  pct,
  vehicleLabel,
  violationLabel,
} from "../lib/format";
import type { Challan, ViolationRecord } from "../lib/types";
import { IconCheck, IconClose, IconImage } from "./icons";
import { ConfidenceChip, SeverityChip } from "./ui";

const ROW = "flex items-start justify-between gap-4 border-b border-slate-200 py-2";
const KEY = "text-xs text-slate-500";
const VAL = "text-right text-[13px] text-slate-900";

export function CaseDrawer({
  record,
  onClose,
  onIssued,
}: {
  record: ViolationRecord | null;
  onClose: () => void;
  onIssued: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState<Challan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset transient state whenever a different case is opened.
  useEffect(() => {
    setImgError(false);
    setIssuing(false);
    setIssued(null);
    setError(null);
  }, [record?.violation_id]);

  useEffect(() => {
    if (!record) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [record, onClose]);

  if (!record) return null;

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
        location: "Bengaluru City",
        image_hash: record.image_hash,
      });
      setIssued(challan);
      onIssued();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to issue challan");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Case file"
        className="fixed right-0 top-0 z-50 flex h-screen w-[480px] max-w-[94vw] flex-col border-l border-slate-300 bg-white"
      >
        {/* header */}
        <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="font-mono text-[11px] text-slate-500">{record.violation_id}</div>
            <div className="mt-0.5 font-mono text-lg font-semibold tracking-wide text-slate-900">
              {record.plate_number ?? "PLATE UNREAD"}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
          >
            <IconClose width={16} height={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* evidence */}
          <div className="mb-5 overflow-hidden rounded-md border border-slate-300 bg-slate-50">
            {imgError ? (
              <div className="flex aspect-video flex-col items-center justify-center gap-2 text-slate-400">
                <IconImage width={28} height={28} />
                <span className="font-mono text-[11px]">/api/evidence/{record.violation_id.slice(0, 8)}/image</span>
                <span className="text-xs">Annotated image not available</span>
              </div>
            ) : (
              <img
                src={evidenceImageUrl(record.violation_id)}
                alt="Annotated evidence"
                className="aspect-video w-full bg-white object-contain"
                onError={() => setImgError(true)}
              />
            )}
          </div>

          <div className="mb-2 flex items-center gap-2">
            <SeverityChip severity={record.severity} />
            <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
              {vehicleLabel(record.vehicle_type)}
            </span>
          </div>

          {/* detected violations */}
          <div className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Detected violations
          </div>
          <div className="overflow-hidden rounded-md border border-slate-200">
            {record.violations.map((v, i) => (
              <div
                key={`${v.type}-${i}`}
                className="flex items-start justify-between gap-3 border-b border-slate-200 px-3 py-2.5 last:border-b-0"
              >
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">{violationLabel(v.type)}</div>
                  {v.description && <div className="text-xs text-slate-500">{v.description}</div>}
                </div>
                <ConfidenceChip value={v.confidence} />
              </div>
            ))}
          </div>

          {/* case file */}
          <div className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Case file</div>
          <dl>
            <div className={ROW}>
              <dt className={KEY}>Captured</dt>
              <dd className={`${VAL} tnum`}>{formatDateTime(record.timestamp)}</dd>
            </div>
            <div className={ROW}>
              <dt className={KEY}>Plate read</dt>
              <dd className={VAL}>
                {record.plate_number ? (
                  <span className="font-mono">
                    {record.plate_number} · {pct(record.plate_confidence)}
                  </span>
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
              <dd className={`${VAL} font-mono text-xs`}>
                {record.vehicle_bbox ? `[${record.vehicle_bbox.join(", ")}]` : "image-level"}
              </dd>
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

        {/* action footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
          {issued ? (
            <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2.5 text-[13px] text-green-800">
              <div className="flex items-center gap-2 font-semibold">
                <IconCheck width={16} height={16} /> Challan issued
              </div>
              <div className="mt-1 font-mono text-xs text-green-700">{issued.challan_id}</div>
              <div className="mt-1 text-xs">
                Fine <span className="font-semibold">{formatINR(issued.fine_total)}</span> ·{" "}
                {issued.legal_sections.join(", ")}
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  Estimated fine
                  <div className="tnum text-base font-semibold text-slate-900">{formatINR(fine)}</div>
                </div>
                <button
                  onClick={issue}
                  disabled={issuing}
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {issuing ? "Issuing…" : "Issue Challan"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
