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

## Shared with the original — single source of truth (no copies)

`src/lib/{types,scoring,data}.ts` here are thin re-export shims of the originals in `pride-index/`:

```ts
export * from '../../../pride-index/src/lib/scoring';
```

So there is exactly one scoring module, one data model, and one generated dataset across both
frontends — they cannot drift. The data itself is **regenerated and validated from the workbook at
build time**: this app's `prebuild` script runs `pride-index`'s ingest pipeline
(`npm run ingest`), which recomputes every score, asserts it matches the workbook formula, enforces
that every scored action has a source URL, and `exit(1)`s the build on any failure. The Astro app
then reads `pride-index/src/data/index-data.json` directly — there is no copied snapshot. (Vite's
`server.fs.allow` is set to permit the sibling-project import in dev; see `astro.config.mjs`.)

> Note: building this app requires `pride-index/`'s dependencies to be installed (for the ingest
> step). CI installs both. The `pride-index/` SPA is no longer deployed; it remains as the
> data-authoring/preview tool and the home of the pipeline + scoring tests.

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
