<div align="center">

# Traffic Violation Detection · Image Processing

<img alt="React" src="https://img.shields.io/badge/React-18-2563eb?style=flat-square">
<img alt="Vite" src="https://img.shields.io/badge/Vite-5-2563eb?style=flat-square">
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-2563eb?style=flat-square">
<img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-2563eb?style=flat-square">

Traffic-enforcement console for the Bengaluru Traffic Police. Strict,
utilitarian, light-theme; reads live from the read-only detection API.

</div>

## Palette — "Sentinel"

A deliberate, documented set (defined in `src/index.css` `@theme`), not stock
framework defaults. Colour is used by **role**, never decoration.

| Token | Hex | Role |
|---|---|---|
| Brand | `#2563EB` | primary action, active nav |
| Info | `#3B82F6` | total / informational accent |
| Critical | `#EF4444` | high severity, low confidence |
| Warning | `#F59E0B` | pending, medium confidence |
| Success | `#10B981` | confirmed, high confidence |
| Canvas | `#F8FAFC` (slate-50) | application background |
| Surface | `#FFFFFF` | cards & tables |
| Sidebar | `#0F172A` (slate-900) | navigation rail |
| Ink / muted / faint | `#111827` / `#6B7280` / `#9CA3AF` | text hierarchy |
| Rules | `#E5E7EB` / `#D1D5DB` | 1px borders |

Neutral system sans throughout (no decorative faces); monospace for
identifiers (plates, IDs, hashes). Numbers are tabular. Type is weight-led —
22px/600 page titles, 32px/700 KPI figures, 11px/500 uppercase labels.

## Views

- **Overview** — weighted, accent-bordered KPI cards (with a small base
  sparkline), **model performance** from `outputs/metrics.json` (precision /
  recall / mAP), a **type donut** (Recharts), and proportional confidence bars.
- **Violations** — the detection log as a dense, filterable, paginated data
  grid (subtle alternating rows). Row → case file.
- **Case file** (drawer) — evidence image (`/api/evidence/{id}/image`, graceful
  fallback), per-violation confidence, all persisted fields incl. SHA-256, an
  **estimated fine**, and a working **Issue Challan** action.
- **Challans** — issued-challan register with fine totals and pill status
  badges (amber pending / green paid).
- **System** — Export (client-side CSV of the loaded log) and Settings.

## Backend contract (read-only, Python untouched)

| Endpoint | Use |
|---|---|
| `GET /health` | connection status (animated live dot) |
| `GET /api/violations` (+ `/{id}`) | detection log |
| `GET /api/analytics/summary`, `/metrics` | totals, model metrics |
| `GET /api/evidence/{id}/image`, `/metadata` | evidence |
| `GET /api/challans`, `POST /api/challans` | issue & list challans |

The ML endpoints (`/process`, `/upload`) are out of UI scope. Breakdowns the
backend doesn't aggregate are computed in the browser (`src/lib/analytics.ts`).

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api → :8000)
npm run build      # typecheck + production build → dist/
npm run preview
```

Start the backend in another terminal (`make run-api`). The dev server proxies
`/api` and `/health` to `VITE_API_TARGET` (default `http://localhost:8000`); set
`VITE_API_BASE` for a different origin (see `.env.example`). A production
`dist/` build is auto-served by the backend at `/` (see `api/main.py`).

## Structure

```
src/
├── lib/          types, api client, formatters, analytics
├── hooks/        useViolationsData, useChallans (live API)
├── components/   Sidebar, Topbar, ViolationsTable, CaseDrawer, charts, ui, icons
├── pages/        Overview, Violations, Challans
└── index.css     Tailwind v4 entry + Sentinel palette tokens
```

Recharts powers the type donut; sparklines and confidence bars are hand-rolled.
