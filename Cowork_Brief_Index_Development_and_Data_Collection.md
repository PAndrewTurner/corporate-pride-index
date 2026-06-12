# Cowork Brief — Corporate Pride Index: Development & Data Collection

**Prepared for:** Cowork agents (evaluation, research, and data collection)
**Project:** The Corporate Pride Index — https://pandrewturner.github.io/corporate-pride-index
**Maintainer contact:** CorpPrideIndex@outlook.com
**Status of index at time of writing:** 200 companies · 513 sourced actions · all build-time validation passing

---

## 0. How to use this brief

This document hands Cowork three categories of work:

1. **Data collection** — research and structure new evidence into the index's exact schema (§4–§6).
2. **Evaluation** — assess submitted/collected evidence against the project's confidence and fairness standards before it enters the index (§7).
3. **Development** — build the planned submission/appeals pipeline and supporting data work (§8).

Every output must be **schema-exact** (§3) and **citation-complete** (§5). Work that cannot be sourced does not ship — this is the non-negotiable rule of the instrument. A company with no documented actions sits at the neutral baseline of 50; silence is never scored as harm, and unsourced claims are never scored at all.

---

## 1. What the index is

The Corporate Pride Index scores major American companies 0–100 on the **depth and consistency** of their LGBTQ+ support, derived entirely from documented, sourced actions. It is an accountability instrument, not a sentiment tracker. The central thesis: **a reversal reveals more than the original commitment ever did.** A company that publicly supported the community and then retreated under pressure scores worse than one that never committed, because the retreat proves the support was contingent.

The site is a pure presentation layer over a single Excel workbook (`Corporate_Pride_Index_Data.xlsx`). Scores are recomputed and validated from raw evidence at build time; the workbook is the source of truth. **All data collection ultimately targets new/edited rows in that workbook.**

---

## 2. The scoring model (must be internalized before collecting data)

Every company starts at **50** (neutral). Documented actions move the score:

```
score = clamp(
    50                                   // neutral baseline
  + min(20, cosmetic + commercial)       // the rainbow-washing cap
  + civic + financial + structural       // substance, uncapped
  + negative,                            // harm, uncapped
  0, 100
)
```

Two rules govern everything:

- **The +20 cosmetic cap.** Cosmetic + Commercial points (logos, posts, merch) combined can never contribute more than +20. A company cannot brand its way past Neutral; it must spend, show up, or change policy. **Do not collect cosmetic actions expecting them to move a high score — they saturate fast.**
- **Reversal asymmetry.** Negatives are uncapped and individually heavier than their positive mirror (a DEI policy earns +20; removing it costs −32; lobbying against LGBTQ+ legislation costs −40). **One good deed does not cancel twenty bad ones, and this is intentional.** Collected evidence must respect this — do not "balance" a company's record to seem fair. Report what the record proves.

### Bands
| Band | Range |
|---|---|
| Champion | 80–100 |
| Ally | 65–79 |
| Neutral | 50–64 |
| Performative | 35–49 |
| Harmful | 20–34 |
| Adversarial | 0–19 |

---

## 3. The exact scoring rubric (Action IDs)

**Every collected action MUST use one of these Action IDs with its exact point value.** Do not invent IDs or alter points — build validation rejects mismatches.

### Positive
| Action ID | Tier | Points | Description |
|---|---|---|---|
| `p_logo_rainbow` | Cosmetic | +3 | Rainbow logo / social profile filter |
| `p_generic_post` | Cosmetic | +2 | Generic "we support Pride" post |
| `p_flag_display` | Cosmetic | +4 | Pride flag at offices / HQ |
| `p_merch_collection` | Commercial | +6 | Pride merchandise collection |
| `p_merch_proceeds` | Commercial | +10 | Merch proceeds donated to LGBTQ+ orgs |
| `p_collab` | Commercial | +8 | Collaboration with queer artists/brands |
| `p_parade_sponsor` | Civic | +12 | Pride parade / event sponsorship |
| `p_parade_march` | Civic | +10 | Employees march (organized) |
| `p_erg_support` | Civic | +15 | LGBTQ+ ERG funded |
| `p_community_events` | Civic | +12 | Hosts / joins community events |
| `p_donation_small` | Financial | +15 | Donation < $100K |
| `p_donation_large` | Financial | +22 | Donation $100K–$1M+ |
| `p_matching` | Financial | +18 | Employee donation matching |
| `p_recurring` | Financial | +25 | Multi-year recurring commitment |
| `p_dei_explicit` | Structural | +20 | Explicit DEI policy naming LGBTQ+ |
| `p_benefits` | Structural | +22 | Partner / transition health benefits |
| `p_consistent_history` | Structural | +28 | 5+ year consistent support record |
| `p_leadership_vocal` | Structural | +18 | C-suite publicly advocates |
| `p_anti_discrim_policy` | Structural | +25 | Anti-discrim policy (orientation + identity) |

### Negative (tier is always `—`)
| Action ID | Points | Description |
|---|---|---|
| `n_anti_lgbtq_donations` | −30 | Donations to anti-LGBTQ+ politicians/PACs |
| `n_anti_lgbtq_orgs` | −35 | Funding anti-LGBTQ+ organizations |
| `n_lobbying` | −40 | Lobbying against LGBTQ+ legislation |
| `n_benefits_rollback` | −28 | Rolled back LGBTQ+ employee benefits |
| `n_dei_removal` | −32 | Removed LGBTQ+ language from DEI policy |
| `n_pride_retreat` | −22 | Publicly retreated from Pride commitments |
| `n_us_only` | −12 | US support only; discriminatory abroad |
| `n_greenwashing` | −8 | Pride washing — branding, no substance |
| `n_selective` | −10 | Selective inclusion (excludes trans/NB) |

If a real, sourced action does not fit any ID, **do not force it** — flag it to the maintainer as a candidate for a new rubric entry, with the evidence.

---

## 4. Workbook schema (collection target)

Collected data is delivered as rows for these sheets. Field names are exact.

### `Company_Master` (one row per company)
`Company` · `Ticker` · `Sector` · `Revenue ($B)` · `HRC CEI Score` · `CEI Year` · `Still Submitting CEI?` (Yes/No) · five context flags (`Post-Jan2025 Reversal?`, `Pressure-Driven?`, `June-Only?`, `Trans/NB Exclusion?`, `Geo Hypocrisy?` — each Yes/No) · `Analyst Notes`.
Leave point/score/band columns blank or as drag-filled formulas; the site recomputes them.

### `Action_Log` (the evidence trail — the core deliverable)
`Company` (must match Company_Master exactly) · `Action ID` (from §3) · `Action Description` · `Tier` · `Polarity` · `Points` (must match the rubric exactly) · `Year` · `Source URL` (**required**) · `Source Type` (see §5) · `Post-Jan2025?` (Yes/No) · `Notes`.

### `Score_Rationale` (one row per company, **same row order as Company_Master**)
`Verdict (one line)` · `Why — Drivers Up` · `Why — Drivers Down` · `Decisive Factor` · `Trajectory` (`Improving` / `Stable` / `Declining` / `Sharp Reversal`) · `Confidence` (`High` / `Medium` / `Low`).
The Company column is positional — content is keyed by row position, not the name cell.

### `Social_Media_Log` (optional supporting)
`Company` · `Platform` · `Post Date` · `Description` · `Post URL / Archive` · `Engagement (if noted)` · `Later Deleted?` (Yes/No — deleted posts render with a marker; capture the archive) · `Notes`.

### `Statements_Reports` (optional supporting)
`Company` · `Record Type` · `Date` · `Title / Context` · `Excerpt / Summary` · `Speaker / Author` · `Source URL`.

---

## 5. Sourcing standard & evidence tiering (the 95% confidence gate)

**Different proof carries different weight.** This is the heart of the planned verification system and the rule for all collection now. Assign `Source Type` and a confidence judgment per the tiers below.

| Tier | Source Type values | Trust | Verification required |
|---|---|---|---|
| **T1 — Primary public record** | `SEC`, `FEC`, `Company` (official filing/press release), `HRC`, `GLAAD` | Highest | Auto-acceptable once the document is fetched and the claim is confirmed verbatim. SEC/FEC filings are dispositive. |
| **T2 — Established reporting** | `News` | High | Requires the outlet to be reputable and the claim corroborated by the underlying primary source where one exists. |
| **T3 — Archived web** | `Archive` (Wayback/archive.today) | High for *deletions* | The archive **is** the evidence when a company scrubbed its own content. Capture the archive URL and the capture date. |
| **T4 — Social / statements** | social posts, speeches, unverified claims | Lowest | **Can be faked or AI-generated.** Never sufficient alone. Requires independent corroboration before scoring. |

### The 95% rule
A piece of evidence enters the index only when verification reaches **≥95% confidence** that the action is real, correctly classified, and correctly dated. Confidence is built by:
1. Fetching the cited source and confirming it states the claim.
2. Cross-referencing against actions already in the index for that company (no duplicates, no contradictions).
3. Independently searching for corroborating or contradicting reports.
4. Checking whether a later correction/reversal exists that the original record missed.

**Asymmetric thresholds:**
- **Adding a new negative action:** ≥95%.
- **Adding context/correction without removing an existing entry:** lower bar (still must be sourced).
- **Removing or overturning an existing entry:** ≥99%. Removal is more gameable than addition, so it must clear a higher bar.

---

## 6. Data collection workstreams

Deliver each as workbook-ready rows (§4) plus a short confidence note (§7) per action.

### 6A. Expanded company universe
Add companies beyond the current 200: large private companies with significant public footprints, mid-caps, and non-U.S. multinationals operating heavily in the U.S. market. For each new company, collect a full Action_Log (positives and negatives), Company_Master row, and a Score_Rationale row. **A new company with a thin record correctly lands near 50 — do not pad it.**

### 6B. Temporal / trajectory data
For existing companies, collect the *dates* needed to support year-over-year score history (a planned feature). Every action already carries a `Year`; where finer dating exists (full dates of reversals, pre/post a known pressure event), capture it in `Notes` so trajectory can later be charted, not just labeled.

### 6C. Legislative mapping
For every `n_anti_lgbtq_donations`, `n_anti_lgbtq_orgs`, and `n_lobbying` action, research and record (in `Notes`) the **specific bill, PAC, or candidate** and the **outcome**, with an FEC/OpenSecrets or primary citation. This feeds the planned "money → legislative outcome" mapping.

### 6D. Correction sweep (fairness audit)
Re-verify existing negative actions against the §5 standard, specifically hunting for **later corrections the original collection missed** — an action reported at the time but subsequently reversed, retracted, or corrected by the company. Where found, propose the corrective Action_Log row (the record keeps both sides, cited) rather than deleting the original.

### 6E. Sector taxonomy cleanup
The workbook currently has 26 sector labels, several of which are single-company hyphenated variants (`Retail / Beauty`, `Food & Beverage / Technology`, `Retail / E-commerce / Pet`, `Financial Services / Insurance`, etc.). Propose a normalized mapping that folds these into the ~15 canonical sectors (Technology, Retail — Big Box, Financial Services, …) so sector averages are meaningful. **Deliverable: a mapping table only** — do not silently re-bucket; the maintainer approves the taxonomy.

---

## 7. Evaluation protocol (per action and per submission)

For **every** action you collect or evaluate, attach a structured confidence report:

```
Company:            <exact Company_Master name>
Proposed Action ID: <from §3>     Points: <exact>     Year: <yyyy>
Polarity / Tier:    <…>
Claim:              <one sentence — what the company did>
Source URL:         <link>        Source Type: <SEC|FEC|Company|HRC|GLAAD|News|Archive|Social>
Evidence Tier:      <T1–T4 from §5>
Verification steps: 1) source fetched & confirms claim? <Y/N + quote>
                    2) duplicates/contradictions vs existing index? <none / detail>
                    3) independent corroboration? <link(s) / none found>
                    4) later correction or reversal? <none / detail>
Confidence:         <0–100%>   Threshold met? <Y/N for the applicable bar in §5>
Recommendation:     <ADD new row | ADD correction | OVERTURN existing (≥99%) | REJECT | ESCALATE>
Rationale:          <2–3 sentences>
```

- Anything **below threshold → REJECT or ESCALATE**, never "include tentatively."
- Anything that would create a **new rubric category → ESCALATE** with evidence.
- **Self-submissions from a company about itself meet the same 95% bar as any other source** and get no trust premium. Favorable self-evidence is verified exactly like adversarial evidence.

---

## 8. Development workstream — the submission & verification pipeline

The index's flagship planned feature is a public submission/appeals system. Cowork's role is to **prototype and evaluate the verification engine**, not to change the public site's architecture (approved entries are just new Action_Log rows — the frontend is unchanged).

### Pipeline stages to build/evaluate
1. **Intake** — capture: company, claimed action, source URL, submitter-classified source type, submitter type (public vs. company-self). Enforce **one submission per company per person per day** (IP + email), and a **per-company cap on pending submissions** to prevent flooding during news cycles.
2. **Anti-gaming** — detect the "same report resubmitted daily to fake multiplicity" pattern: dedupe by (company + claim + source) across time and submitters; repeated identical submissions count as **one**, never as corroboration.
3. **Automated confidence analysis** — a high-reasoning Claude model (extended thinking / high effort) runs the §7 protocol: fetch source, classify tier, cross-reference the existing index, search for corroboration/contradiction, check for later corrections, and emit the structured confidence report with a reasoning trace.
4. **Human review queue** — only submissions that clear the model's confidence gate advance to a human review surface that renders the confidence report and reasoning trace for one-click approve/reject. **No entry reaches the index without human sign-off.**
5. **Commit** — approved submissions become Action_Log rows; the workbook rebuilds and revalidates exactly as today.

### Evaluation deliverables for the pipeline
- A **test set** of real and deliberately-faked submissions (including AI-generated fake "statements," a genuine SEC/FEC filing, a real archived deletion, a valid correction, and a daily-resubmission gaming attempt) with expected verdicts.
- A run of the §7 protocol against that set, reporting precision/recall on catching fakes and the false-accept rate on the 95% gate.
- Notes on where the model's confidence calibration over- or under-shoots, so thresholds can be tuned.

---

## 9. Guardrails (do not violate)

- **No unsourced data, ever.** Every Action_Log row needs a working `Source URL`.
- **Exact Action IDs and points** from §3 — the build rejects drift.
- **Do not balance the books.** Report what the record proves; the asymmetry between good and bad acts is the methodology, not a bug.
- **Removal needs ≥99%; addition needs ≥95%; corrections are added, not substituted.**
- **Self-submissions get no trust premium.**
- **Escalate, don't improvise** — new rubric categories, sector re-taxonomy, and any removal of existing evidence are maintainer decisions.
- **Match `Company` strings exactly** across all sheets, or referential-integrity validation fails the build.

---

## 10. Reference

- Live site: https://pandrewturner.github.io/corporate-pride-index
- Methodology page (authoritative scoring explanation): `/methodology`
- Future Enhancements page (public roadmap this brief implements): `/future`
- Data model (TypeScript types): `pride-index/src/lib/types.ts`
- Scoring module (the exact formula, used by both ingest and the site): `pride-index/src/lib/scoring.ts`
- Ingest + validation pipeline: `pride-index/scripts/ingest.ts`
- White paper (project background & methodology): `Corporate_Pride_Index_White_Paper.md`
