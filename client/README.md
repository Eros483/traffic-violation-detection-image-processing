<div align="center">

# Traffic Violation Detection · Enforcement Console

<img alt="React" src="https://img.shields.io/badge/React-18-6b728e?style=flat-square">
<img alt="Vite" src="https://img.shields.io/badge/Vite-5-6b728e?style=flat-square">
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-6b728e?style=flat-square">
<img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-6b728e?style=flat-square">
<img alt="React Router" src="https://img.shields.io/badge/React_Router-6-6b728e?style=flat-square">
<img alt="Vitest" src="https://img.shields.io/badge/Vitest-2_·_23_tests-5d8a6a?style=flat-square">

Traffic-enforcement console for the Bengaluru Traffic Police. Strict,
utilitarian design; reads live from the read-only detection API.

</div>

## Palette

A deliberate, documented set (defined in `src/index.css` `@theme`), not stock
framework defaults. Colour is used by **role**, never decoration — a muted,
desaturated register.

| Token | Hex | Role |
|---|---|---|
| Brand | `#6B728E` | primary action, active nav |
| Critical | `#B75D5D` | high severity, low confidence |
| Warning | `#B0894F` | pending, medium confidence |
| Success | `#5D8A6A` | confirmed, high confidence |
| Canvas | `#F5F6F8` | application background |
| Surface | `#FFFFFF` | cards & tables |
| Sidebar | `#111827` | navigation rail (dark in both themes) |
| Ink / muted | `#1F2937` / `#6B7280` | text hierarchy |
| Rules | `#E2E8F0` | 1px borders |

Neutral system sans throughout (no decorative faces); monospace for
identifiers (plates, IDs, hashes). Numbers are tabular. Type is weight-led —
22px/600 page titles, 32px/700 KPI figures, 11px/500 uppercase labels.

### Light / dark theme

Light and dark are both supported, selectable from the **Settings** page and
persisted to `localStorage` (`src/theme/ThemeContext.tsx`). The four accent
hues above are **identical** in both themes — only the neutral surfaces, text,
and borders invert (overrides in `src/index.css` under `[data-theme="dark"]`),
so colour meaning never shifts.

## Routes & views

Nine routes (`HashRouter`), all under one application shell — Sidebar +
Navbar + animated outlet (`src/layouts/AppLayout.tsx`).

| Path | View | What it shows |
|---|---|---|
| `/` | **Dashboard** | accent-bordered KPI cards (real trend sparkline), model performance from `outputs/metrics.json`, recent-activity feed, capture-source panel |
| `/analytics` | **Analytics** | 30-day trend area chart, violation-type donut, top repeat-offenders ranking |
| `/violations` | **Violations** | the detection log as a dense, filterable, paginated grid (search by plate, filter by type/severity); `?plate=` deep-links from the offenders ranking |
| `/violations/:id` | **Case file** | evidence image (graceful 404 fallback), per-violation confidence meters, all persisted fields incl. SHA-256, estimated fine, and a working **Issue Challan** action |
| `/challans` | **Challans** | issued-challan register with fine-total rollup and status pills |
| `/challans/:id` | **Challan detail** | printable e-ticket preview; links back to the source violation |
| `/live` | **Live Detection** | upload a still image → run the full pipeline → annotated result + per-record detections, each issuable as a challan |
| `/settings` | **Settings** | theme selection (light/dark) and an about panel |
| `*` | **Not found** | 404 with a route back to the dashboard |

## Live Detection

Drag-and-drop or click to upload any image (`image/*`). The file is POSTed to
`POST /api/violations/upload` as multipart form-data; the response carries the
records, the base64 annotated image, and the preprocessing steps applied.
Results are **transient** — the upload endpoint runs the pipeline in-memory and
does not write to `outputs/violations.jsonl`, so detections appear here only
until a challan is issued from them.

## Backend contract

| Endpoint | Use |
|---|---|
| `GET /health` | connection status (animated live dot in the navbar) |
| `GET /api/violations` (+ `/{id}`) | detection log |
| `GET /api/analytics/summary`, `/metrics` | totals, model metrics |
| `GET /api/evidence/{id}/image`, `/metadata` | evidence |
| `GET /api/challans`, `POST /api/challans` | list & issue challans |
| `POST /api/violations/upload` | Live Detection pipeline run |

Breakdowns the backend doesn't aggregate (severity / type / vehicle splits,
daily trend, repeat-offender ranking) are computed in the browser
(`src/lib/derive.ts`).

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api, /health → :8000)
npm run build      # typecheck + production build → dist/
npm run preview
npm run test       # Vitest (23 tests, 6 files)
npm run lint       # ESLint 9 (flat config)
```

Start the backend in another terminal (`make run-api`). The dev server proxies
`/api` and `/health` to `VITE_API_TARGET` (default `http://localhost:8000`); set
`VITE_API_BASE` for a different origin (see `.env.example`). A production
`dist/` build is auto-served by the backend at `/` (see `api/main.py`).

> **Why `HashRouter`?** The build is served by FastAPI's `StaticFiles` mount,
> which has no SPA fallback. Hash routing keeps every deep link working on a
> hard refresh without any backend change.

## Structure

```
src/
├── types/        domain types (backend mirror + view models)
├── lib/          api client, constants, badge colours, derive (analytics), formatters
├── hooks/        useFetch (generic), useData (violations/challans)
├── context/      DataContext (single live data load, shared)
├── theme/        ThemeContext (light/dark, localStorage)
├── layouts/      AppLayout (Sidebar + Navbar + animated Outlet)
├── components/   Sidebar, Navbar, PageTransition, ViolationsTable, icons
│   └── ui/       14 modules — Badge (+SeverityBadge, ConfidenceBadge), StatusBadge,
│                 PlateNumber, ConfidenceMeter, TypeTags, AsyncBoundary, SectionHeader,
│                 Sparkline, StatCard, KPICard, ActivityRow, ViolationCard, TypeDonut, TrendChart
├── pages/        Dashboard, Analytics, ViolationsList, ViolationDetail,
│                 ChallansList, ChallanDetail, LiveDetection, Settings, NotFound
├── test/         Vitest setup + shared fixtures
└── index.css     Tailwind v4 entry + palette tokens (light + dark)
```

## Testing

Vitest + Testing Library (jsdom). **23 tests across 6 files** —
`lib/constants`, `lib/derive`, `lib/api` (mocked fetch), `hooks/useFetch`,
`components/ui/Badge`, and `pages/ViolationsList` (rendered with a mocked data
context). Recharts powers the trend chart and type donut; sparklines are
hand-rolled SVG.
