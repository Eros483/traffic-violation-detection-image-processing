import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createChallan, uploadImage } from "../lib/api";
import { useConsoleData } from "../context/DataContext";
import { ISSUING_LOCATION } from "../lib/constants";
import { estimatedFine, formatINR, violationLabel } from "../lib/format";
import { ConfidenceBadge, SectionHeader, SeverityBadge } from "../components/ui";
import { IconCheck, IconUpload } from "../components/icons";
import type { UploadResult, ViolationRecord } from "../types";

const PANEL = "rounded-md border border-slate-200 bg-white";

export function LiveDetection() {
  const navigate = useNavigate();
  const { reloadChallans } = useConsoleData();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [issued, setIssued] = useState<Record<number, string>>({});
  const [issuingIdx, setIssuingIdx] = useState<number | null>(null);

  const run = async (file: File) => {
    setBusy(true);
    setError(null);
    setResult(null);
    setIssued({});
    setFileName(file.name);
    try {
      const res = await uploadImage(file);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void run(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) void run(file);
  };

  const issue = async (record: ViolationRecord, idx: number) => {
    setIssuingIdx(idx);
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
      setIssued((m) => ({ ...m, [idx]: challan.challan_id }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to issue challan");
    } finally {
      setIssuingIdx(null);
    }
  };

  return (
    <div className="space-y-5 p-6">
      <div className={PANEL}>
        <SectionHeader title="Upload an image" />
        <div className="p-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            disabled={busy}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-slate-400 hover:bg-slate-100 disabled:opacity-60"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400">
              <IconUpload width={22} height={22} />
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {busy ? "Running detection pipeline…" : "Click to choose, or drag an image here"}
            </span>
            <span className="text-xs text-slate-500">{fileName ?? "JPEG or PNG · processed server-side via the detection pipeline"}</span>
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {result && (
        <div className="grid grid-cols-3 gap-5">
          <div className={`${PANEL} col-span-2 overflow-hidden`}>
            <SectionHeader title="Annotated result" trailing={<span className="text-xs text-slate-500">{result.preprocess_steps.length ? result.preprocess_steps.join(", ") : "no preprocessing applied"}</span>} />
            <div className="bg-slate-50 p-4">
              <img
                src={`data:image/jpeg;base64,${result.annotated_image_b64}`}
                alt="Annotated detection result"
                className="w-full rounded border border-slate-200 bg-white object-contain"
              />
            </div>
          </div>

          <div className={PANEL}>
            <SectionHeader title={`Detected (${result.records.length})`} />
            {result.records.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">No violations detected in this image.</div>
            ) : (
              <div className="space-y-3 p-4">
                {result.records.map((r, idx) => {
                  const fine = estimatedFine(r.violations);
                  const done = issued[idx];
                  return (
                    <div key={`${r.violation_id}-${idx}`} className="rounded-md border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-semibold text-slate-900">{r.plate_number ?? "PLATE UNREAD"}</span>
                        <SeverityBadge severity={r.severity} />
                      </div>
                      <ul className="mt-2 space-y-1">
                        {r.violations.map((v, i) => (
                          <li key={`${v.type}-${i}`} className="flex items-center justify-between gap-2 text-[13px]">
                            <span className="text-slate-700">{violationLabel(v.type)}</span>
                            <ConfidenceBadge value={v.confidence} />
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                        {done ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                            <IconCheck width={14} height={14} /> Challan {done.slice(0, 8)}
                          </span>
                        ) : (
                          <>
                            <span className="tnum text-xs text-slate-600">{formatINR(fine)}</span>
                            <button
                              onClick={() => issue(r, idx)}
                              disabled={issuingIdx === idx}
                              className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-[#fff] hover:bg-blue-800 disabled:opacity-60"
                            >
                              {issuingIdx === idx ? "Issuing…" : "Generate Challan"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(issued).length > 0 && (
                  <button onClick={() => navigate("/challans")} className="w-full rounded-md border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    View challan register
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
