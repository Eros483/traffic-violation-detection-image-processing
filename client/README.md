# TrafficVision AI — Frontend

A traffic-enforcement dashboard for the **Traffic Violation Detection** project. It reads
violation records and analytics from the Python/FastAPI backend and presents them as KPIs,
searchable lists, an evidence gallery, and analytics charts.

> This is the web client only. The detection pipeline (YOLOv8 + PaddleOCR + optional vision LLM)
> and the REST API live in the sibling `traffic-violation-detection-image-processing/` folder.

## Tech Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | React 19 + TypeScript                    |
| Build tool     | Vite                                     |
| Routing        | React Router DOM v7                       |
| Styling        | Tailwind CSS v4 (semantic CSS-var tokens) |
| Animation      | Framer Motion                            |
| Charts         | Recharts                                 |
| Icons          | Lucide React                             |
| Testing        | Vitest + Testing Library + JSDOM         |

State is handled with a small custom `useFetch` hook — no Redux/Zustand/React Query.

## Getting Started

```bash
npm install
npm run dev      # Vite dev server, http://localhost:5173
```

The dashboard needs the backend running for live data:

```bash
# in ../traffic-violation-detection-image-processing
make run-api     # FastAPI on http://localhost:8000
```

### Configuration

The API base URL is read from the `VITE_API_URL` environment variable and defaults to
`http://localhost:8000`. To point at a different backend, create a `.env`:

```
VITE_API_URL=http://localhost:8000
```

## Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start the Vite dev server            |
| `npm run build`      | Type-check (`tsc -b`) + build to `dist/` |
| `npm run preview`    | Preview the production build         |
| `npm run lint`       | Run ESLint                           |
| `npm run test`       | Run the test suite once (Vitest)     |
| `npm run test:watch` | Run tests in watch mode              |

## Routes

| Path               | Page             | Purpose                                                              |
| ------------------ | ---------------- | -------------------------------------------------------------------- |
| `/`                | Dashboard        | KPIs, violation trend chart, recent activity, live-feed placeholder  |
| `/detect`          | LiveDetection    | Placeholder — backend has no image-upload endpoint yet               |
| `/violations`      | ViolationsList   | All violations, filterable by type and plate search                  |
| `/violations/:id`  | ViolationDetail  | Single record: vehicle info, evidence hash, approve / reject actions |
| `/evidence`        | EvidenceGallery  | Grid view of violation records                                       |
| `/challans`        | ChallansList     | Placeholder — backend has no challans endpoint yet                   |
| `/challans/:id`    | ChallanDetail    | Client-side challan preview (not persisted)                          |
| `/analytics`       | Analytics        | Trend by weekday, breakdown by type, top offenders                   |
| `/settings`        | Settings         | Theme toggle, about                                                  |

All pages render inside `AppLayout` (fixed Sidebar + sticky Navbar + routed `<Outlet />`).

## Backend API

The API client lives in `src/lib/api.ts`. Endpoints consumed (all `GET`):

| Endpoint                                  | Returns                                                       |
| ----------------------------------------- | ------------------------------------------------------------- |
| `/health`                                 | `{ status }`                                                  |
| `/api/violations?page=&page_size=`        | `{ items: ViolationRecord[], total, page }`                   |
| `/api/analytics/summary`                  | `{ total_violations }`                                        |

Pages that need derived figures (trend by weekday, breakdown by type, top offenders) compute
them client-side from `/api/violations` in `src/lib/derive.ts`. Challans are previewed in the
UI only — the backend does not yet persist them.

## Project Structure

```
src/
├── App.tsx                # Route definitions
├── main.tsx               # App entry
├── lib/
│   ├── api.ts             # Fetch client + ApiError, VITE_API_URL base
│   ├── constants.ts       # VIOLATION_META (labels, fines), legal sections
│   ├── derive.ts          # Client-side aggregations for charts/tables
│   └── badges.ts          # Badge class helpers
├── types/index.ts         # ViolationRecord, Challan, enums
├── hooks/useFetch.ts      # Async fetch state (data/loading/error/reload)
├── context/ThemeContext.tsx  # light/dark theme, persisted to localStorage
├── layouts/AppLayout.tsx
├── pages/                 # One file per route
├── components/
│   ├── shared/            # Sidebar, Navbar
│   └── ui/                # Badge, StatCard, AsyncBoundary, LoadingState, etc.
└── test/                  # Vitest setup + fixtures
```

### Data flow

`useFetch(fetcher, deps)` runs the fetcher on mount, exposes `{ data, loading, error, reload }`,
and cancels on unmount. Pages wrap the result in `<AsyncBoundary>`, which renders
`LoadingState`, `ErrorState` (with retry), or the children once data is available.

### Theming

`ThemeContext` toggles a `dark` class on `<html>` and persists the choice to `localStorage`
(`tv-theme`). Colors are defined as CSS custom properties in `src/index.css`; components use
semantic tokens (`--text-primary`, `--border`, `--primary`, …). The sidebar uses a fixed navy
palette independent of theme.

## Data Models

See `src/types/index.ts`. The core record from the backend:

```ts
interface ViolationRecord {
  violation_id: string
  timestamp: string                 // ISO-8601
  image_path: string                // server-side path, not a URL
  image_hash: string                // SHA-256
  vehicle_bbox: [number, number, number, number] | null
  vehicle_type: 'two_wheeler' | 'four_wheeler' | 'vehicle' | 'unknown' | string
  plate_number: string | null
  plate_confidence: number | null
  violations: { type: ViolationType; confidence: number; description?: string }[]
  severity: 'high' | 'standard'
  legal_sections: string[]
}
```

Violation labels, fines, and MV Act mappings are defined statically in `src/lib/constants.ts`.
