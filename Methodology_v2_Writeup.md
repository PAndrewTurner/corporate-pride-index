# Corporate Pride Index — Scoring Methodology (Version 2.1)

*Adopted June 18, 2026. This document explains how every company in the index is scored, why the model is built the way it is, and how to maintain it. It supersedes the original v1 additive model. Version 2.1 adds the **engagement factor** (Section 4a). The authoritative implementation is the TypeScript scoring module `pride-index/src/lib/scoring.ts`; `pride-index/scripts/sync-workbook.ts` writes its results back into `Corporate_Pride_Index_Data.xlsx` so the workbook's stored aggregates and the build-time ingest cross-check stay in agreement.*

---

## 1. What the index measures

The Corporate Pride Index asks a single question of 200 major companies: **do they actually stand with the LGBTQ+ community, or do they only market to it?** A rainbow logo in June is cheap; a multi-year donation, an explicit non-discrimination policy, or refusing to abandon DEI under political pressure is not. The scoring model is designed so that *substance outweighs signaling*, and so that **reversing a commitment is treated as worse than never having made one** — because a reversal proves the original support was contingent rather than principled.

Every score resolves to a 0–100 number and one of six bands, accompanied by a written rationale that traces to sourced evidence.

---

## 2. The scoring pipeline

Each company starts from a **neutral baseline of 50** and moves up or down based on documented, sourced actions logged in the Action_Log. The final score is computed in four steps:

```
Final Score = clamp( 0, 100,
                50 (baseline)
              + min(20, Cosmetic + Commercial)              ← capped "signaling" points
              + diminish(Civic + Financial + Structural) × engage ← substantive positives
              + diminish(Negatives) )                        ← all negative actions
```

- **`min(20, …)`** caps the combined value of cheap signaling so a company cannot buy a high score with logos and merchandise alone.
- **`diminish(…)`** applies *diminishing returns* (Section 4) to substantive positives and to negatives, so the single most significant action on each side carries full weight and additional similar actions count for progressively less.
- **`× engage`** is the *engagement factor* (Section 4a): the substantive subtotal is multiplied by 0.85 for companies with no public-facing engagement, mirroring the pride-washing penalty in the opposite direction.
- **`clamp(0, 100, …)`** bounds the result to the published range.

Positive and negative points are summed separately and meet at the baseline, so the same diminishing logic applies symmetrically in both directions.

---

## 3. The action taxonomy

Every logged action maps to a fixed Action ID with a fixed point value (the read-only Scoring_Reference sheet). Positives are grouped into five tiers; negatives are a flat severity-ranked set.

**Positive actions**

| Tier | Action | Points |
|---|---|---|
| Cosmetic | Rainbow logo / profile filter | +3 |
| Cosmetic | Generic "we support Pride" post | +2 |
| Cosmetic | Pride flag at offices/HQ | +4 |
| Commercial | Pride merchandise collection | +6 |
| Commercial | Merch proceeds donated to LGBTQ+ orgs | +10 |
| Commercial | Collaboration with queer artists/brands | +8 |
| Civic | Pride parade/event sponsorship | +12 |
| Civic | Employees march (organized) | +10 |
| Civic | LGBTQ+ ERG funded | +15 |
| Civic | Hosts/joins community events | +12 |
| Financial | Donation < $100K | +15 |
| Financial | Donation $100K–$1M+ | +22 |
| Financial | Employee donation matching | +18 |
| Financial | Multi-year recurring commitment | +25 |
| Structural | Explicit DEI policy naming LGBTQ+ | +20 |
| Structural | Partner / transition health benefits | +22 |
| Structural | 5+ year consistent support record | +28 |
| Structural | C-suite publicly advocates | +18 |
| Structural | Anti-discrimination policy (orientation + identity) | +25 |

**Negative actions** (all carry a negative sign; never capped, but diminished)

| Action | Points |
|---|---|
| Lobbying against LGBTQ+ legislation | −40 |
| Funding anti-LGBTQ+ organizations | −35 |
| Donations to anti-LGBTQ+ politicians/PACs | −30 |
| Removed LGBTQ+ language from DEI policy | −32 |
| Rolled back LGBTQ+ employee benefits | −28 |
| Publicly retreated from Pride commitments | −22 |
| US support only; discriminatory abroad | −12 |
| Selective inclusion (excludes trans/NB) | −10 |
| Pride-washing — branding, no substance | −8 |

The Cosmetic and Commercial tiers are the "signaling" categories subject to the +20 cap. Civic, Financial, and Structural are the "substance" categories that score uncapped (but diminished). Severity is encoded in the point values: lobbying and funding hate groups are the worst; symbolic gestures and pride-washing are the mildest.

---

## 4. Diminishing returns — the core of v2

The defining feature of v2 is that **stacked actions of the same kind yield diminishing marginal value**. After sorting a company's actions by magnitude (largest first), each successive action is multiplied by a decreasing weight:

| Position | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th+ |
|---|---|---|---|---|---|---|---|---|
| Weight | 1.00 | 0.70 | 0.50 | 0.35 | 0.25 | 0.15 | 0.10 | 0.05 |

This is applied independently to the substantive-positive pool and to the negative pool. (The Cosmetic+Commercial cap is applied first and is not diminished further.)

**Why it exists.** The original v1 model capped cheap *positive* signaling but summed *negatives* without limit. The result was two distortions:

1. **Bottom-end compression.** A company with three stacked negatives (e.g. a −30 political-donation flag + a −32 DEI removal + a −22 Pride retreat = −84) slammed straight into the 0 floor, making a soft, partial reverser indistinguishable from the worst actors in the index.
2. **Top-end compression.** Substantive positives were uncapped, so the most committed companies piled up raw scores far past 100 (one company reached a raw 174) and all flattened to an identical 100, erasing the differences between them.

v2 resolves both by applying the *same* diminishing logic to both tails. Doing many good things still raises a score and doing many bad things still lowers it — but neither can run away to the clamp on volume alone, so the 0–100 scale keeps resolution at both ends.

---

## 4a. The engagement factor (new in v2.1)

The model has always penalized **visible signaling without substance** — the pride-washing action (−8). What it lacked, and what v2.1 adds, is the symmetric case: **substance without visibility.**

After diminishing returns, the substantive-positive subtotal is multiplied by an **engagement factor**:

```
engage = 1.00  if the company has any Commercial OR Civic positive action
         0.85  otherwise (internal-only substance)
```

**What counts as engagement.** *Commercial* (Pride merchandise, donated-proceeds collections, collaborations with queer artists) and *Civic* (parade/event sponsorship, organized marching, a funded ERG, hosting community events) are the categories where a company is *doing something public*. A bare *Cosmetic* gesture — a rainbow logo, a generic post, a flag — is deliberately excluded: by the index's own substance-over-signaling logic, a logo is too cheap to immunize a company against the adjustment.

**Why this definition, not "Civic only."** A civic-only test would wrongly flag brands whose public engagement is *commercial* (e.g. an apparel company with a Pride collection and queer-artist collaboration but no parade sponsorship). Commercial-or-Civic correctly spares those visible brands and isolates genuinely quiet actors — companies whose entire record is internal Financial/Structural substance.

**Magnitude and intent.** On a strong record the 0.85 multiplier removes roughly 8 points — the same order as the pride-washing −8 — so the two cases are treated symmetrically. It is a *proportional* adjustment, not a flat penalty: a company with little substance loses little, and the factor never erases a strong record (substantive support still dominates). It simply prevents "do it quietly" from tying an otherwise-identical company that also stood behind its commitments publicly.

**What it does not fix.** Because the factor is proportional and the scale still clamps at 100, a company with very large internal substance and zero public engagement (e.g. Costco) is discounted but can remain at the ceiling. Distinguishing companies *at* 100 is the separate top-end-compression question and is out of scope for v2.1.

---

## 5. Reversal asymmetry is preserved

The index's central principle — *a reversal scores worse than never having committed* — survives v2 intact, because **the first (largest) negative always carries full weight (1.00).** A single, decisive reversal therefore still pushes a company below the 50 baseline.

Worked illustration: a company that logged an explicit DEI policy (+20 structural) and later removed it (−32) nets `50 + 20 − 32 = 38` — below baseline, in the Performative band. Had it never had the policy at all, it would sit at the neutral 50. The reversal is the more damning record, exactly as intended. What diminishing returns changes is only the *marginal* penalty of piling additional negatives on top of the first — so that a company is not pushed into the same flat 0 as a categorically worse actor.

---

## 6. Bands

| Score | Band | Meaning |
|---|---|---|
| 80–100 | **Champion** | Deep, sustained, substantive support |
| 65–79 | **Ally** | Real support, some gaps |
| 50–64 | **Neutral** | Mixed, minimal, or offsetting record |
| 35–49 | **Performative** | Signaling outweighs substance, or a partial reversal |
| 20–34 | **Harmful** | Net-negative record |
| 0–19 | **Adversarial** | Actively works against LGBTQ+ interests |

---

## 7. Worked examples

**A holder (substantive positives, no reversal).** A company with an anti-discrimination policy (+25), transgender-inclusive benefits (+22), an ERG (+15), and a generic Pride post (+2 cosmetic):
- Cosmetic/Commercial = min(20, 2) = 2
- Substantive, sorted [25, 22, 15] → 25×1.0 + 22×0.70 + 15×0.50 = 25 + 15.4 + 7.5 = 47.9
- Score = clamp(0,100, 50 + 2 + 47.9) = **100, Champion**

**A single decisive reverser.** A longtime ally that, in 2025, removed its DEI language (−32) after years of an ERG (+15) and benefits (+22) and a Pride sponsorship (+12 civic):
- Substantive positives, sorted [22, 15, 12] → 22 + 10.5 + 6 = 38.5
- Negatives, sorted [−32] → −32
- Score = clamp(0,100, 50 + 38.5 − 32) = **56, Neutral** — its substance keeps it afloat, but the reversal has pulled it down from where its positives alone (≈88) would have placed it.

**A stacked reverser.** A company with a 2021 anti-LGBTQ donation flag (−30), a 2025 DEI removal (−32), and a Pride retreat (−22), with modest positives (logo +3, generic +2, parade +12, ERG +15):
- Cosmetic/Commercial = min(20, 5) = 5; Substantive [15, 12] → 15 + 8.4 = 23.4
- Negatives, sorted [−32, −30, −22] → −32×1.0 + −30×0.70 + −22×0.50 = −32 − 21 − 11 = −64
- Score = clamp(0,100, 50 + 5 + 23.4 − 64) = **14, Adversarial**. Under v1's pure summation this company floored at 0, tied with categorically worse actors; v2 keeps it distinct.

---

## 8. Context flags (descriptive, not scored)

Five yes/no flags on each company add qualitative context without altering the score: **Post-Jan-2025 Reversal**, **Pressure-Driven**, **June-Only**, **Trans/NB Exclusion**, and **Geo Hypocrisy**. They let a reader distinguish, for example, a reversal made under explicit federal/FCC pressure from an ideologically motivated one, even when both produce the same logged negative.

---

## 9. The yearly time series

The Yearly_Scores sheet recomputes each company's score for every year from 2015 to the present using the **same v2 formula applied cumulatively** — a given year's score reflects only the actions dated on or before that year. This produces an honest trajectory: a company that built positives through 2024 and reversed in 2025 shows a clear rise-then-fall. By construction, the most recent year's column equals the company's current Company_Master score (verified by an automated anchor check).

A **Trajectory Shape** label (Rising, Stable, Declining, Late Decline, Sharp Reversal) summarizes the curve.

---

## 10. Confidence and sourcing

Every Action_Log row requires a working **source URL**. Sourcing priority runs: HRC Corporate Equality Index and GLAAD reports; company press releases, ESG/proxy filings; FEC/OpenSecrets and Data for Progress for political donations; established news outlets; and the Wayback Machine for deleted or altered pages (essential for proving a reversal). Each company's rationale carries a **High / Med / Low confidence** flag reflecting how complete and well-sourced its record is; a Low flag signals a provisional score resting on thin evidence.

---

## 11. Implementation and maintenance

The authoritative implementation is the TypeScript scoring module (`pride-index/src/lib/scoring.ts`), exercised by a unit-test suite and re-exported by the Astro app so both frontends, the published methodology, and the build-time validation all use the exact same arithmetic. The workbook stays partly live around it:

- `pride-index/scripts/sync-workbook.ts` reads the Action_Log, applies the cap, diminishing logic, and engagement factor via the scoring module, and writes the two aggregate inputs — **Positive Pts (capped)** and **Negative Pts** — into Company_Master, and rebuilds the **Yearly_Scores** time series (each year recomputed cumulatively from the actions dated on or before it).
- **Final Score, Band, and Sector_Summary remain live Excel formulas** that read those stored inputs, so they update automatically when the workbook is opened.
- `pride-index/scripts/ingest.ts` then regenerates `index-data.json` from the workbook and asserts the scoring module reproduces the stored aggregates and the Yearly_Scores anchor for all 200 companies; the build fails if they disagree.

**After any edit to the Action_Log or to `scoring.ts`, run `npm run sync-workbook` then `npm run ingest` (the latter runs automatically before `npm run dev` / `npm run build`).** The ingest integrity audit confirms every logged row matches the Scoring_Reference polarity and points (catching, for example, a negative accidentally entered with a positive sign).

---

## 12. Known limitations and open questions

- **Structural substance vs. public advocacy (addressed in v2.1).** Earlier versions rewarded documented internal substance (CEI 100, ERGs, benefits, non-discrimination policy) with no discount for companies that held that substance while doing little visible community engagement, so some quiet "held-firm" companies scored as Champions despite a low public profile. The **engagement factor** (Section 4a) now supplies the missing symmetric adjustment: substance with no Commercial or Civic public engagement is multiplied by 0.85. A residual limitation remains — because the factor is proportional and the scale clamps at 100, a company with very large internal substance and zero public engagement can still sit at the ceiling.
- **Thin records.** A minority of companies rest on very few sourced actions; their scores sit near the neutral baseline and are flagged Low confidence rather than padded with assumed activity.
- **Political-donation attribution.** Negative donation flags are scored only where a corporate PAC's giving to anti-LGBTQ+ legislators is documented by a credible source; the personal political activity of executives is recorded as context but not scored as a corporate action.
- **Diminishing-returns weights are a judgment.** The 1.00 / 0.70 / 0.50 / … schedule is a defensible but tunable choice; changing it shifts how aggressively stacked actions are discounted.

---

*Questions this document should let a skeptical reader answer: why a company landed in its band, what would move it, and where the model's discretion lies.*
