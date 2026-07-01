# The Record — Money Trail, Movers, Receipts

**Date:** 2026-07-01 · **Status:** Approved (user, in-session)

## Purpose

Surface accountability material the workbook already holds but the site doesn't show:
documented anti-LGBTQ+ political giving, the biggest score movers over the decade, and
the concrete record of retreats/deletions. One new nav tab, **The Record**, bundles three
statically generated views so the material has a strong home without crowding the nav.

## Architecture

Astro SSG pages in `pride-index-astro/src/pages/record/`, sharing a small sub-nav strip:

- `/record/` — landing: intro + three cards, each with a headline stat.
- `/record/money/` — the Political_Donations ledger, site-wide.
- `/record/movers/` — biggest risers/fallers from the existing yearly timelines.
- `/record/receipts/` — the retreat record, grouped by year.

All three are fully static (no React islands): pre-sorted tables, both mover windows
rendered as sections, receipts grouped under year headers. Zero added JS keeps the
SSG/SEO ethos and simplifies the build. Nav gains "The Record" between Compare and
Methodology.

## Data pipeline

`pride-index/scripts/ingest.ts` gains a `Political_Donations` parser:

- New type `PoliticalDonation { amount, amountUsd, period, recipientsScope, scoredNote, sourceUrl, notes }`
  (in `pride-index/src/lib/types.ts`); `Company.donations: PoliticalDonation[]`;
  `IndexData.donationLedger` for rows not attached to a master company (e.g. the NYC Pride
  shortfall aggregate) rendered as context footnotes.
- `amountUsd` is parsed from the Amount string where cleanly numeric; approximate amounts
  (`~$750K shortfall`) stay display-only.
- Validation: every row needs Company + Source URL (build fails otherwise); rows whose
  Company is not in Company_Master are allowed into the site-wide ledger with a console
  warning, never attached to a company.

## Views

**Money Trail** — headline stats (companies documented, summed `amountUsd` as "at least $X");
table sorted by amount desc: company (link) · amount · period · recipients/scope · scored?
· citation. Unattached rows follow as "Context" entries. **Company pages** gain a
"Political & legislative record" section (between Social and HRC CEI) rendered only when
`c.donations.length > 0`.

**Movers** — two sections, each with fallers and risers ranked side by side: "The decade"
(timelineChange, 2015→now) and "Since Jan 2025" (current score − score at 2024). Rows show
from→to in band colors, delta badge, trajectory shape, and a hand-rolled inline SVG
sparkline of the yearly timeline. Top 15 per list; risers/fallers with |Δ| ≥ 5 only.

**Receipts** — every `n_dei_removal`, `n_pride_retreat`, `n_benefits_rollback` action plus
deleted Social_Media_Log posts, grouped by year (desc). Card: company (link) · year ·
description · points · citation. Headline: total count of documented retreats.

## Non-goals

No data download, no submissions backend, no scoring changes, no edits to the legacy
`pride-index/` React pages (shared ingest/types extended only).

## Verification

Ingest passes with the new parser; `npm run build` (Astro) succeeds; money page totals
match a manual sum; AT&T company page shows the donations section, Apple's does not;
Verizon appears atop post-2025 fallers with −54; receipts count matches a JSON query;
both themes render.
