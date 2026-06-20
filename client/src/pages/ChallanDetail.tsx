import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useConsoleData } from "../context/DataContext";
import { displaySection, formatDateTime, formatINR, violationLabel } from "../lib/format";
import { SectionHeader, StatusBadge } from "../components/ui";
import { IconChevronLeft } from "../components/icons";

const PANEL = "rounded-md border border-slate-200 bg-white";
const ROW = "flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-2.5 last:border-b-0";
const KEY = "text-xs text-slate-500";
const VAL = "text-right text-[13px] text-slate-900";

export function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { challans, challansLoading } = useConsoleData();

  const challan = useMemo(() => challans.find((c) => c.challan_id === id) ?? null, [challans, id]);

  if (challansLoading) return <div className="p-6 text-sm text-slate-500">Loading challan…</div>;

  if (!challan) {
    return (
      <div className="p-6">
        <button onClick={() => navigate("/challans")} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <IconChevronLeft width={15} height={15} /> Back to challans
        </button>
        <div className={`${PANEL} px-6 py-16 text-center`}>
          <div className="text-sm font-semibold text-slate-700">Challan not found</div>
          <p className="mt-1 text-sm text-slate-500">No challan matches id <span className="font-mono">{id}</span>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button onClick={() => navigate("/challans")} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <IconChevronLeft width={15} height={15} /> Back to challans
      </button>

      <div className="mx-auto max-w-2xl">
        <div className={PANEL}>
          {/* ticket header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Traffic Challan</div>
              <div className="mt-0.5 font-mono text-lg font-semibold text-slate-900">{challan.challan_id}</div>
              <div className="mt-0.5 text-xs text-slate-500">Issued {formatDateTime(challan.issued_at)} · {challan.location}</div>
            </div>
            <StatusBadge status={challan.status} />
          </div>

          {/* amount */}
          <div className="flex items-end justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Plate</div>
              <div className="mt-1 font-mono text-xl font-semibold tracking-wide text-slate-900">
                {challan.plate_number ?? <span className="font-sans text-base font-normal italic text-slate-400">Plate unread</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Fine payable</div>
              <div className="tnum mt-1 text-2xl font-bold text-slate-900">{formatINR(challan.fine_total)}</div>
            </div>
          </div>

          {/* line items */}
          <SectionHeader title="Violations" />
          <table className="w-full border-collapse text-[13px]">
            <tbody>
              {challan.violations.map((v, i) => (
                <tr key={`${v.type}-${i}`} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-5 py-2.5 text-slate-900">{violationLabel(v.type)}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-xs text-slate-600">
                    {displaySection(challan.legal_sections[i] ?? challan.legal_sections[0] ?? "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* meta */}
          <dl className="border-t border-slate-200">
            <div className={ROW}>
              <dt className={KEY}>Vehicle type</dt>
              <dd className={VAL}>{challan.vehicle_type}</dd>
            </div>
            <div className={ROW}>
              <dt className={KEY}>Legal sections</dt>
              <dd className={VAL}>{challan.legal_sections.map(displaySection).join(", ") || "—"}</dd>
            </div>
            <div className={ROW}>
              <dt className={KEY}>Evidence hash</dt>
              <dd className={`${VAL} break-all font-mono text-[11px]`}>{challan.image_hash || "—"}</dd>
            </div>
            <div className={ROW}>
              <dt className={KEY}>Source violation</dt>
              <dd className={VAL}>
                <button onClick={() => navigate(`/violations/${challan.violation_id}`)} className="font-mono text-[11px] text-blue-700 hover:underline">
                  {challan.violation_id.slice(0, 8)}
                </button>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
