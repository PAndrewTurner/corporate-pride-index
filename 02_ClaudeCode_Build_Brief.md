# Corporate Pride Index — Claude Code Build Brief
### Phase 2 of 2 · Model: Fable 5 · Input: completed Excel workbook · Output: interactive website

> **Your job:** consume the completed `Corporate_Pride_Index_Data_Template.xlsx` produced by Phase 1 (Cowork) and build an interactive website that showcases the index — the scores, the evidence behind them, and the story they tell about corporate LGBTQ+ accountability. **The data already exists and is already scored. You are building the presentation layer.**

---

## 1. Context

The Corporate Pride Index scores 75 major American companies on the depth and consistency of their LGBTQ+ support, on a 0–100 scale (baseline 50 = neutral). It exists to distinguish genuine, sustained allyship from performative "rainbow capitalism," and it treats reversals — companies that supported Pride then retreated under political pressure, especially after the January 2025 second Trump inauguration — as the most damning signal.

The canonical case is **Verizon**: years of rainbow logos and DEI commitments, then a rapid 2025 reversal that strips those commitments to ease a regulatory approval. It scores ~34 ("Harmful") despite its positive history, because the reversal proves the support was never structural. Your site must make stories like this legible at a glance.

This is **data journalism and an accountability instrument** — credible, sober, and unforgettable. Not a Pride celebration.

---

## 2. The Input Data

A single Excel workbook with six sheets. Build an ingestion step that parses it into typed JSON at build time.

| Sheet | Contents | Use |
|---|---|---|
| **Company_Master** | One row per company: name, ticker, sector, revenue, HRC CEI, point totals, **final score**, **band**, five context flags, analyst notes | The spine of the site — every company page and the dashboard table |
| **Score_Rationale** | One row per company: **verdict, drivers up, drivers down, decisive factor, trajectory, confidence** | **The "why" behind each score — the centerpiece of every company page** |
| **Action_Log** | One row per action: company, Action ID, description, tier, polarity, points, year, **source URL**, source type, post-Jan2025 flag | The evidence trail — render as cited action lists and timelines |
| **Social_Media_Log** | Pride-related posts: platform, date, description, URL/archive, deleted? | Per-company social activity feed |
| **Statements_Reports** | Qualitative records: DEI policy quotes, press releases, exec quotes, ESG excerpts, mission changes | Quoted evidence blocks on company pages |
| **Scoring_Reference** | Fixed Action ID → points lookup | Power the in-app methodology / scoring engine |
| **Sector_Summary** | Per-sector averages, min/max, champion & harmful counts | Sector benchmarking views |

**Scoring formula (reproduce it in-app so scores are auditable):**
```
score = clamp(50 + min(20, cosmetic+commercial points) + civic + financial + structural + negative, 0, 100)
```
Bands: 80–100 Champion · 65–79 Ally · 50–64 Neutral · 35–49 Performative · 20–34 Harmful · 0–19 Adversarial.

Build a scoring module that recomputes each score from raw Action_Log rows and asserts it matches the workbook's stored value — this makes the methodology transparent and catches data drift.

---

## 3. Tech Stack

- **React + TypeScript**, Vite build
- **Tailwind CSS**
- **Recharts** for distributions, sector comparisons, score timelines
- Data layer: parse the xlsx → JSON at build time (e.g. `sheetjs`); structure it so a later migration to SQLite/Postgres needs no component rework
- A standalone **scoring module** that derives scores from raw actions (see §2)

---

## 4. Core Views

### Index Dashboard
- Sortable, filterable master table of all 75 companies: score, band, sector, HRC CEI, positive/negative point split
- Score-distribution histogram across the full index
- Sector-average comparison chart (from Sector_Summary)
- **"Biggest Movers" / "Hall of Shame & Honor"** panel surfacing the steepest declines (reversals) and the highest sustained scores
- Filter by sector, band, and context flags (e.g. show all "Post-Jan2025 Reversal" companies)

### Company Profile
This is the heart of the site. A visitor clicks a company to learn its score **and the reasoning behind it.** The "why" is not a footnote — it is the main event.

- Hero: name, sector, big score, band chip, the 0–100 gradient bar with the marker at the company's position
- **The "Why" panel (directly below the score, before anything else):** render the Score_Rationale row as the centerpiece —
  - the **verdict** as a prominent lead sentence
  - **what raised the score** and **what lowered it** as two clear, scannable columns
  - the **decisive factor** called out as a highlighted statement ("What tipped the score: …")
  - a **trajectory** indicator (Improving / Stable / Declining / Sharp Reversal) with appropriate visual treatment
  - a **confidence** badge
- Full scoring breakdown beneath the "why": every positive and negative action listed, **each with its source URL as a visible, clickable citation** — this is the evidence backing the reasoning above
- Context flags displayed prominently (reversal, pressure-driven, June-only, trans/NB exclusion, geo hypocrisy)
- Quoted evidence blocks from Statements_Reports (especially "before/after" policy language for reversals)
- Social activity feed from Social_Media_Log, with deleted posts visibly marked
- HRC CEI cross-reference, including a callout if the company stopped submitting

**Design the page so the reasoning and the evidence are visually linked** — a reader should see the claim ("deleted DEI language in 2025") and be able to immediately find the sourced action row and statement that proves it. The score, the why, and the evidence form one connected argument.

### Compare Mode
- Side-by-side scoring of 2–4 companies
- Sector-benchmark overlay

### Methodology
- Plain-language explanation of the framework, the tiers, the bands, the +20 cosmetic cap, and reversal asymmetry
- The Verizon standard told as a worked example
- The full Scoring_Reference table
- Sourcing standards — so any skeptical reader can see the scores are defensible

---

## 5. Design Direction

- **Tone:** dark, editorial — closer to a data-journalism investigation than a Pride graphic. Restraint signals seriousness and credibility.
- **Color:** deploy the rainbow spectrum **only with purpose** — as the score gradient bar, never as decorative wallpaper. When the spectrum appears, it should mean something.
- **Band encoding:** consistent color from emerald (Champion) through red (Adversarial); use it everywhere a band appears so the palette becomes a readable language.
- **Typography:** a distinctive display face for headers paired with a clean monospace for scores and figures — let the numbers feel precise and quantitative.
- **Defensibility is the product:** every score is one click from its evidence. Citations are visible, not buried. A reader should never have to trust you — they should be able to check you.
- Read `/mnt/skills/public/frontend-design/SKILL.md` and commit to a bold, intentional aesthetic direction rather than a templated default.

---

## 6. Deliverables

1. A working React/TypeScript application implementing all four views
2. The xlsx→JSON ingestion pipeline
3. A transparent, auditable scoring module that derives every score from raw actions and validates against the workbook
4. The Methodology page, written for public scrutiny
5. A short README: data schema, how to refresh data from an updated workbook, how to add or edit a company

---

## 7. Definition of Done

- [ ] All 75 companies render with correct scores, bands, and gradient positions
- [ ] **Every company page leads with the "why": verdict, drivers up/down, decisive factor, trajectory**
- [ ] **Reasoning is visually linked to its supporting evidence — claims connect to sourced action rows**
- [ ] Every action shows its source as a clickable citation
- [ ] Reversal stories (Verizon and peers) are legible at a glance via flags and before/after evidence
- [ ] Scoring module reproduces every workbook score (validation passes)
- [ ] Dashboard, Profile, Compare, and Methodology views all functional
- [ ] Sector benchmarking renders from Sector_Summary
- [ ] Site builds clean from the workbook with a documented refresh path
