# Crime Data Dashboard

A responsive, interactive crime-data analytics proof-of-work project for a **Microsoft Fabric & AI learning hackathon**. Casefile uses a dark “Night Operations” interface and 8,963 deterministic synthetic incident records. No real criminal-history data or personal records are included.

**[Crime data dashboard](https://github.com/VJoycelyn/crime-data-dashboard)** — open the GitHub repository.

## The working sample

Explore synchronized date, offense, district, severity, status and search filters; drill into monthly trends, offense composition and fictional district activity; sort and paginate records; open casefile drawers with incident facts, timelines, classifications, disposition and synthetic subject identifiers. Export the selected view to CSV and copy a share link that preserves the active filter context. The AI analyst generates a labeled briefing from server-computed aggregate metrics only.

**Important:** this is a learning application, not a criminal-history lookup, a background-check service, an official crime dataset or a law-enforcement decision system. A report or closed case is not a conviction.

## Technology and project structure

The frontend is React + TypeScript with Vite, Recharts and Lucide. Express serves the frontend and an authenticated upstream AI integration. Dataset generation, validation, filtering and aggregation are shared between client and server, so model inputs use the same analytical context as the charts.

`src/App.tsx` owns navigation and filter synchronization. `src/components/` contains charts, maps, record exploration, AI and methodology views. `shared/data.ts` owns synthetic data and metrics, while `shared/share.ts` validates portable view links. `server/index.ts` implements health, AI, request validation, caching, concurrency limits and rate limiting. The Dockerfile builds and serves the full application.

## Run and check

Use Node 22 and pnpm 11.25.0:

```bash
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

The dashboard listens on port 3000 (or `PORT`). Development includes the Vite middleware. For a production build:

```bash
pnpm check
pnpm test
pnpm build
pnpm start
```

The real AI endpoint reads `MANUS_API_URL` and `MANUS_API_KEY` on the **server only** at runtime. These are injected by the managed application environment. Do not commit credentials or put them in frontend variables. Outside that environment, the interactive analytics still works; AI displays an availability message until a compatible secure service is configured. The health endpoint is `/api/health`.

## Microsoft Fabric learning architecture

The in-app Methodology & Fabric view explains a **proposed**, not currently connected, reference pipeline: Data Factory ingestion → OneLake bronze → Spark silver validation and deduplication → gold analytical tables → Power BI and aggregate AI interpretation. The application is not a Power BI embed, and no live Fabric workspace, public-data connector or scheduled refresh is connected. The downloadable synthetic CSV can be used as a Fabric learning input.

The architecture reference is [Microsoft's medallion lakehouse documentation](https://learn.microsoft.com/en-us/fabric/onelake/onelake-medallion-lakehouse-architecture). Asset and source notes are in `SOURCES.md`.

## Dataset and definitions

Snapshot cutoff: October 24, 2026. Dataset dates: January 1, 2025–October 24, 2026. Northbridge and its five districts are invented. Geography is schematic; intensity reflects counts, not real incident positions or population-adjusted rates. The default view is May 1–October 24, 2026. Partial months must not be compared directly with full months.

Total incidents counts distinct records. Closure rate is Closed ÷ total; it is not an official police clearance rate. Active cases combines Open and Investigating. Prior-period change uses the immediately preceding window of equal inclusive length with identical non-date filters and suppresses the percentage when coverage is incomplete or the baseline is zero.

AI receives aggregates, not subject identifiers. Output is labeled, can contain errors, and must be verified against the underlying dashboard. Do not use it for individual guilt, risk scoring, demographic inference, eligibility screening or predictive policing.
