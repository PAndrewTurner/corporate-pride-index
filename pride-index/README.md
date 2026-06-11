# The Corporate Pride Index

An interactive accountability site scoring 88 major American companies (0–100) on the depth and
consistency of their LGBTQ+ support. Built with React + TypeScript + Vite + Tailwind + Recharts.
The data source is a single Excel workbook; the site is a pure presentation layer over it, with
every score recomputed and validated from raw evidence at build time.

## Quick start

```bash
npm install
npm run dev      # ingests the workbook, then starts Vite on :5173
npm run build    # ingest → typecheck → production build into dist/
npm run preview  # serve the production build
```

## How the data flows

```
../Corporate_Pride_Index_Data.xlsx
        │  npm run ingest  (scripts/ingest.ts, runs automatically before dev/build)
        ▼
src/data/index-data.json     ← typed, validated, committed build artifact
        │  import
        ▼
src/lib/data.ts → pages & components
```

The ingestion step (`scripts/ingest.ts`) reads the workbook with SheetJS and emits one JSON file.
**The build fails if validation fails** — a workbook edit that breaks consistency cannot ship.

### Validation performed on every ingest

1. **Score reproduction** — `src/lib/scoring.ts` derives every company's score from its raw
   Action_Log rows and asserts it equals an independent evaluation of the workbook's own formula
   (`clamp(50 + min(20, cosmetic+commercial) + civic + financial + structural + negative, 0, 100)`).
   Note: the workbook stores scores as live Excel formulas without cached values, so "matching the
   workbook" means matching its formula, evaluated at ingest time.
2. **Point integrity** — every Action_Log row's points must match the fixed Scoring_Reference
   lookup for its Action ID.
3. **Referential integrity** — every company named in Action_Log, Social_Media_Log,
   Statements_Reports, or Score_Rationale must exist in Company_Master; slugs must be unique.
4. **Band thresholds** — bands are derived from scores using the workbook's thresholds
   (80 Champion / 65 Ally / 50 Neutral / 35 Performative / 20 Harmful / 0 Adversarial).

`Sector_Summary` stats are computed at ingest from company scores (the workbook sheet ships with
sector names only); the sheet's row order is preserved for display.

## Data schema (workbook → JSON)

| Sheet | JSON | Notes |
|---|---|---|
| Company_Master | `companies[]` core fields | One row per company. `Final Score`/`Band`/point columns are Excel formulas; recomputed at ingest. |
| Score_Rationale | `companies[].rationale` | Aligned to Company_Master **by row order** (its Company column contains formulas/placeholder text). Row N of rationale = row N of master. |
| Action_Log | `companies[].actions[]` | The evidence trail. `Points` must match Scoring_Reference. |
| Social_Media_Log | `companies[].social[]` | `Later Deleted? = Yes` renders with a visible deleted marker. |
| Statements_Reports | `companies[].statements[]` | The first row listing record-type options is skipped. |
| Scoring_Reference | `scoringReference[]` | Fixed Action ID → points rubric; rendered on the Methodology page. |
| Sector_Summary | `sectors[]` | Stats computed at ingest; sheet order kept. |

Full TypeScript types: [src/lib/types.ts](src/lib/types.ts).

## Refreshing the data

1. Replace `Corporate_Pride_Index_Data.xlsx` (one directory above this project) with the updated
   workbook. The path is set in `scripts/ingest.ts` (`WORKBOOK_PATH`).
2. Run `npm run build` (or `npm run ingest` to regenerate JSON alone).
3. If validation fails, the console lists every issue (unknown company, point mismatch, score
   drift…). Fix the workbook and re-run — nothing ships until it's clean.

## Adding or editing a company

1. **Company_Master** — add a row with name, ticker, sector, revenue, HRC CEI columns, the five
   Yes/No context flags, and analyst notes. Leave the point/score/band columns as the formulas in
   the rows above (drag-fill); the site recomputes them regardless.
2. **Score_Rationale** — add the matching row *at the same row position*: verdict, drivers up,
   drivers down, decisive factor, trajectory (`Improving`/`Stable`/`Declining`/`Sharp Reversal`),
   confidence (`High`/`Medium`/`Low`).
3. **Action_Log** — one row per documented action. `Action ID` must be one of the IDs in
   Scoring_Reference and `Points` must match it exactly. Include a `Source URL` for every row —
   uncited actions undermine the entire instrument.
4. Optionally add rows to **Social_Media_Log** and **Statements_Reports** (company name must
   match Company_Master exactly).
5. `npm run build` — validation will catch typos, point mismatches, and missing rationale.

A company with no Action_Log rows scores the neutral baseline of 50.

## Project layout

```
scripts/ingest.ts        xlsx → JSON pipeline + validation (build fails on issues)
src/lib/scoring.ts       the scoring module — formula, cap, bands (used by ingest AND the UI)
src/lib/types.ts         shared data model
src/lib/data.ts          typed access to the generated JSON + band colors/labels
src/components/ui.tsx    band chips, gradient bar, trajectory/confidence badges, citations
src/pages/Dashboard.tsx  sortable/filterable index, histogram, sector chart, shame/honor panels
src/pages/CompanyPage.tsx  hero → "Why" panel → evidence trail → statements → social → CEI
src/pages/Compare.tsx    2–4 companies side by side with sector benchmark overlay
src/pages/Methodology.tsx  framework, bands, Verizon worked example, full rubric, sourcing
```

A later migration to SQLite/Postgres only requires replacing `src/lib/data.ts` with an async data
layer — components consume the `IndexData` types, not the JSON file.
