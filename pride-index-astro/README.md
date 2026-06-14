# Corporate Pride Index — Astro + React islands (SEO preview)

A **non-destructive** parallel rebuild of the existing `pride-index/` React SPA as an
**Astro static site** with **React islands**. The original app is untouched; this folder is a
complete, runnable alternative aimed at the SEO/indexing goal.

## Why this exists

The original is a client-side-rendered SPA: crawlers receive an empty `<div id="root">` on first
load. This version **pre-renders every route to static HTML at build time** (full content + correct
per-page `<title>`/meta/OG tags), while keeping the interactive pieces as hydrated React "islands".
Same data, same look, same interactivity — but indexable.

## What's static vs. an island

| Rendered as static HTML (zero JS) | React island (hydrated) |
| --- | --- |
| All page chrome, hero copy, prose | `ThemeToggle` (dark/light) |
| Company pages: hero, "why" panel, evidence, statements, social, HRC, notes | `CompanySearch` (hero lookup) |
| Sector list + sector page company lists | `DashboardStats` + `DashboardTable` (filter/sort) |
| Methodology (incl. live worked-example math), About, Future | `CompareApp` (the compare tool) |
| Hall of Shame / Honor | Recharts charts (`Histogram`, `SectorChart`, `ScoreTimeline`, `SectorTimelineChart`) |
| | `CompanyMiniHeader` (scroll observer) |

## Shared with the original (copied, not modified)

`src/lib/types.ts`, `src/lib/scoring.ts`, `src/lib/data.ts`, `src/data/index-data.json`, and the
`public/` images are copied verbatim from `pride-index/`. The scoring logic and data model are
therefore identical.

> For production, point Astro at the same `scripts/ingest.ts` output instead of a copied JSON so the
> two stay in lockstep. For this preview, the JSON is a snapshot.

## Key adaptations (the only behavioral rewrites)

- **Routing:** react-router → Astro file-based routing + `getStaticPaths` for `/company/[slug]` and
  `/sectors/[slug]`. In-app `<Link>`/`navigate()` → plain `<a>`/`location` changes.
- **Theme:** React context provider → a DOM-class-based hook (`src/lib/theme.ts`) that islands read
  via a `MutationObserver`, since Astro has no single React root.
- **Dashboard stats → table filtering:** the clickable stat cards and the table are separate islands,
  wired with a `cpi:filter` `CustomEvent` to preserve the original layout and behavior.

## Run

```bash
cd pride-index-astro
npm install
npm run dev      # local dev server
npm run build    # static output to ./dist
npm run preview  # serve the built site
```

Deploys to the same GitHub Pages static host; set `BASE_PATH` for a sub-path deploy
(e.g. `BASE_PATH=/corporate-pride-index/ npm run build`).
