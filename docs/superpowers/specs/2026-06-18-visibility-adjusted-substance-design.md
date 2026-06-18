# Design: Visibility-Adjusted Substance (Methodology v2.1)

*Date: 2026-06-18. Fixes the "substance without visibility" asymmetry — limitation #2 in
`Methodology_v2_Writeup.md` §12 ("no symmetric 'substance without visibility' adjustment").*

## Problem

The v2 model penalizes **visible signaling without substance** (the pride-washing action, −8) but
gives **no adjustment for substance without public engagement**. As a result, companies with strong
*internal* commitment (non-discrimination policy, trans-inclusive benefits, donations) but zero
public or community engagement score as Champions/Allies despite a near-invisible public profile.

Empirically (current 200-company dataset), 22 Champion/Ally companies have ≤4 public-facing points.
They split into two populations:

- **Genuine quiet substance** — Costco (substantive 88, public 0), Southern Company (75, 0),
  Gilead (47, public 2), Rivian (47, 0).
- **Single-action records** — a cluster of ~18 firms at exactly 74 (one +22 structural action + a
  generic post).

## Goal

Introduce a **scored** adjustment (not merely a context flag) that makes "do AND show" outscore
"do quietly," mirroring the pride-washing penalty in spirit and magnitude, while remaining
proportional so it does not flat-punish thin records. Approved direction: a multiplier framed to
land at the pride-washing magnitude (synthesis of "true symmetry" + "engagement multiplier").

## Mechanism

Scale the diminished substantive-positive pool by an **engagement factor**:

```
substantiveContribution = diminish(Civic + Financial + Structural) × engagementFactor

engagementFactor = 1.00  if the company has ≥1 Commercial OR ≥1 Civic positive action
                   0.85  otherwise (internal-only substance)
```

Everything else in the v2 pipeline is unchanged:

```
Final Score = clamp(0, 100, roundHalfEven(
                50
              + min(20, Cosmetic + Commercial)              ← capped signaling (unchanged)
              + diminish(Civic+Financial+Structural) × engagementFactor   ← NEW factor
              + diminish(Negatives) ))                       ← unchanged
```

### Why "Commercial OR Civic" defines engagement

These tiers are *doing something public* — merch collections/collaborations (Commercial) and
parades, marching, ERGs, community events (Civic). A bare **Cosmetic** action (logo, generic post,
flag) is deliberately excluded: per the index's own substance-over-signaling ethos, a rainbow logo
is too cheap to immunize a company against the visibility adjustment. This definition correctly
spares brands whose public engagement is commercial (Levi Strauss, Nike) and isolates true quiet
actors (Costco, Southern, Gilead, Rivian, and internal-only firms).

A *civic-only* definition was rejected: it mislabels visible apparel brands (Levi, Nike) as
invisible because their public work is logged as Commercial, not Civic.

### Why 0.85

On a strong record the factor removes ≈8 points (e.g. Costco's diminished substance ≈58 →
−8.7), matching the existing pride-washing −8 — so it reads as **true symmetry** while being
**proportional** (bigger substance loses proportionally more). Approved over 0.75 (sharper, more
band movement) and a graded schedule (smoother but harder to explain/maintain).

## Modeled impact (current dataset, factor 0.85)

- **34 of 200** scores change, all downward, all gentle.
- **0 Champions and 0 Allies lose their band.**
- 2 bottom-tier firms tip Harmful→Adversarial (UnitedHealth, Cigna) — defensible: token internal
  substance, harmful record, zero public LGBTQ+ engagement.
- Representative shifts: Southern 100→98, Gilead 92→86, Rivian 90→84; the 74-cluster → 71.

### Known limitation (documented, not fixed here)

The multiplier **cannot** move the most extreme quiet case: **Costco stays 100**, because its
diminished substance (~58) × 0.85 still exceeds 50 and re-hits the 100 clamp. Distinguishing
companies *at* the ceiling is the separate top-end-compression problem (raise/rescale the internal
clamp); it is out of scope for this change and noted as a remaining limitation.

## Architecture & sync (decision: scoring.ts authoritative + sync workbook)

`pride-index/src/lib/scoring.ts` is the single computational source of truth. The astro app
re-exports it (`pride-index-astro/src/lib/scoring.ts`) and the data layer
(`pride-index-astro/src/lib/data.ts`), so there is exactly one implementation. `ingest.ts`
regenerates and validates `pride-index/src/data/index-data.json` from
`Corporate_Pride_Index_Data.xlsx`, cross-checking the module against the workbook's stored
`Positive Pts (capped)` / `Negative Pts` and the `Yearly_Scores` anchor (last year == current
score).

Because the engagement factor changes `positiveCapped` and the yearly trajectory for affected
companies, the workbook's stored aggregates must be regenerated or the cross-check (tolerance 0.15)
will trip. The Python recompute scripts referenced in the methodology are **not in this repo**, so
we add a TypeScript sync script that recomputes them from the authoritative module:

- **New script `pride-index/scripts/sync-workbook.ts`** — reads `Corporate_Pride_Index_Data.xlsx`,
  and for each company:
  - recomputes `Positive Pts (capped)` and `Negative Pts` via `computeScore` and writes them into
    `Company_Master`;
  - rebuilds the `Yearly_Scores` grid by calling `computeScore` on the subset of actions dated on
    or before each year (cumulative), so the engagement factor is applied honestly per year and the
    final-year column equals the current score by construction.
  - Writes the workbook back in place.
- `Final Score` / `Band` remain live Excel formulas reading the stored aggregates (unchanged
  formulas; they pick up the new stored values automatically).

## Components touched

| File | Change |
|---|---|
| `pride-index/src/lib/scoring.ts` | Add `ENGAGEMENT_FACTOR = 0.85`, `engagementFactorFor(actions)`, apply factor in `computeScore`; fold into `positiveCapped`; update docstring + worked examples. |
| `pride-index/src/lib/types.ts` | Add `engagementFactor: number` to `ScoreBreakdown` (keep `substantiveDiminished` as the pre-factor value for composition views). |
| `pride-index/src/lib/scoring.test.ts` | Add cases: factored vs unfactored company, the Commercial/Civic boundary, cumulative-by-year behavior. |
| `pride-index/scripts/sync-workbook.ts` (new) | Recompute stored aggregates + `Yearly_Scores` from the module; write back to the xlsx. |
| `Corporate_Pride_Index_Data.xlsx` | Regenerated stored values (via the sync script). |
| `pride-index/src/data/index-data.json` | Regenerated by `ingest.ts` after sync. |
| `Methodology_v2_Writeup.md` | Document the engagement factor (new subsection in §4/§3; update §12 limitation #1 to reflect it now exists; note the residual Costco/clamp limitation). |
| `pride-index/src/pages/Methodology.tsx` | Mirror the methodology copy + worked example. |
| `pride-index-astro/src/pages/methodology.astro` | Mirror the same copy. |

No new context flag (scored adjustment chosen over descriptive flag). `engagementFactor` is exposed
in the breakdown so the UI *can* surface "internal-only substance" later, but that is optional.

## Verification

1. `sync-workbook.ts` runs without error; workbook opens with updated stored values.
2. `ingest.ts` passes — no `Positive Pts mismatch` / `Yearly_Scores` anchor issues; `validation.passed === true`.
3. `scoring.test.ts` passes, including new factor cases.
4. Spot-check shipped numbers against the modeled impact: Southern 98, Gilead 86, Rivian 84, the
   74-cluster at 71, Costco still 100, Levi/Nike unchanged.
5. Both methodology pages render and match `Methodology_v2_Writeup.md`.

## Out of scope

- Top-end / 100-clamp compression (the Costco case and the 20-companies-at-100 pile-up).
- Limitation #1 (baseline-50 / thin-record treatment).
- Any change to negative-side scoring or the diminishing-returns weights.
