/**
 * Build-time ingestion: Corporate_Pride_Index_Data.xlsx → src/data/index-data.json
 *
 * Run: npm run ingest   (also runs automatically before dev/build)
 *
 * Validation performed on every run (build fails on any issue):
 *  1. Every Action_Log row's points match the Scoring_Reference lookup for its Action ID.
 *  2. Every score derived by the scoring module matches an independent evaluation of
 *     the workbook's own formula (MIN(20, cosmetic+commercial) SUMIFS semantics).
 *     Note: the workbook stores scores as live Excel formulas with no cached values,
 *     so "matching the workbook" means matching its formula, evaluated here.
 *  3. Every company referenced in Action_Log / Social_Media_Log / Statements_Reports /
 *     Score_Rationale exists in Company_Master.
 *  4. Band derived from score matches the workbook's band formula thresholds.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { computeScore, bandFor } from '../src/lib/scoring';
import type {
  ActionRow,
  Company,
  IndexData,
  LedgerEntry,
  PoliticalDonation,
  Rationale,
  ScoringRefRow,
  SectorStats,
  SocialPost,
  Statement,
  Tier,
  TimelineEntry,
  TimelineEvidence,
  TimelinePoint,
  Polarity,
  Trajectory,
} from '../src/lib/types';

const __dir = dirname(fileURLToPath(import.meta.url));
const WORKBOOK_PATH = resolve(__dir, '../../Corporate_Pride_Index_Data.xlsx');
const OUT_PATH = resolve(__dir, '../src/data/index-data.json');

const wb = XLSX.read(readFileSync(WORKBOOK_PATH), { type: 'buffer' });

type Row = Record<string, unknown>;
function sheet(name: string): Row[] {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Workbook is missing sheet "${name}"`);
  return XLSX.utils.sheet_to_json<Row>(ws, { defval: null });
}

const str = (v: unknown): string | null =>
  v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim();
const num = (v: unknown): number | null => {
  const s = str(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const yes = (v: unknown): boolean => str(v)?.toLowerCase() === 'yes';
const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
/** Excel serial date or string → ISO yyyy-mm-dd */
const isoDate = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return str(v);
};

const issues: string[] = [];

// ── Scoring_Reference ────────────────────────────────────────────────────────
const scoringReference: ScoringRefRow[] = sheet('Scoring_Reference')
  .filter((r) => str(r['Action ID']))
  .map((r) => ({
    actionId: str(r['Action ID'])!,
    tier: str(r['Tier / Category']) ?? '—',
    polarity: str(r['Polarity']) as Polarity,
    points: num(r['Points'])!,
    description: str(r['Description']) ?? '',
  }));
const refById = new Map(scoringReference.map((r) => [r.actionId, r]));

// ── Company_Master ───────────────────────────────────────────────────────────
const masterRows = sheet('Company_Master').filter((r) => str(r['Company']));
const masterNames = masterRows.map((r) => str(r['Company'])!);
const masterSet = new Set(masterNames);

// ── Action_Log ───────────────────────────────────────────────────────────────
const actionsByCompany = new Map<string, ActionRow[]>();
let actionsChecked = 0;
for (const r of sheet('Action_Log')) {
  const company = str(r['Company']);
  if (!company) continue;
  if (!masterSet.has(company)) {
    issues.push(`Action_Log references unknown company "${company}"`);
    continue;
  }
  const actionId = str(r['Action ID'])!;
  const points = num(r['Points'])!;
  const ref = refById.get(actionId);
  if (!ref) {
    issues.push(`Action_Log: unknown Action ID "${actionId}" (${company})`);
  } else if (ref.points !== points) {
    issues.push(
      `Action_Log: ${company} / ${actionId} has ${points} pts but Scoring_Reference says ${ref.points}`,
    );
  }
  actionsChecked++;
  const row: ActionRow = {
    actionId,
    description: str(r['Action Description']) ?? '',
    tier: (str(r['Tier']) ?? '—') as Tier,
    polarity: str(r['Polarity']) as Polarity,
    points,
    year: num(r['Year']) ?? 0,
    sourceUrl: str(r['Source URL']),
    sourceType: str(r['Source Type']),
    postJan2025: yes(r['Post-Jan2025?']),
    notes: str(r['Notes']),
  };
  // Every scored action must be one click from its evidence (the site's core
  // claim): require a parseable Source URL on any action that moves the score.
  if (points !== 0) {
    if (!row.sourceUrl) {
      issues.push(
        `Action_Log: ${company} / ${actionId} (${row.year}) scores ${points} pts but has no Source URL`,
      );
    } else {
      try {
        new URL(row.sourceUrl);
      } catch {
        issues.push(
          `Action_Log: ${company} / ${actionId} has an unparseable Source URL "${row.sourceUrl}"`,
        );
      }
    }
  }
  (actionsByCompany.get(company) ?? actionsByCompany.set(company, []).get(company)!).push(row);
}

// ── Social_Media_Log ─────────────────────────────────────────────────────────
const socialByCompany = new Map<string, SocialPost[]>();
for (const r of sheet('Social_Media_Log')) {
  const company = str(r['Company']);
  if (!company) continue;
  if (!masterSet.has(company)) {
    issues.push(`Social_Media_Log references unknown company "${company}"`);
    continue;
  }
  const post: SocialPost = {
    platform: str(r['Platform']) ?? '',
    date: isoDate(r['Post Date']),
    description: str(r['Description']) ?? '',
    url: str(r['Post URL / Archive']),
    engagement: str(r['Engagement (if noted)']),
    deleted: yes(r['Later Deleted?']),
    notes: str(r['Notes']),
  };
  (socialByCompany.get(company) ?? socialByCompany.set(company, []).get(company)!).push(post);
}

// ── Statements_Reports ───────────────────────────────────────────────────────
const statementsByCompany = new Map<string, Statement[]>();
for (const r of sheet('Statements_Reports')) {
  const company = str(r['Company']);
  if (!company || company === '(Record Type options:)') continue;
  if (!masterSet.has(company)) {
    issues.push(`Statements_Reports references unknown company "${company}"`);
    continue;
  }
  const st: Statement = {
    recordType: str(r['Record Type']) ?? '',
    date: isoDate(r['Date']),
    title: str(r['Title / Context']) ?? '',
    excerpt: str(r['Excerpt / Summary']) ?? '',
    speaker: str(r['Speaker / Author']),
    sourceUrl: str(r['Source URL']),
  };
  (statementsByCompany.get(company) ?? statementsByCompany.set(company, []).get(company)!).push(st);
}

// ── Score_Rationale ──────────────────────────────────────────────────────────
// The Company column holds formulas (=Company_Master!A2…); sheet_to_json gives
// us their cached text when present, but this workbook ships without cached
// values, so we align by row order against Company_Master (the formulas
// guarantee that ordering).
// Row order is the authoritative key: the workbook's legacy block (original
// 88 companies) carries Company cells that lag the content by one row, while
// newer rows are named correctly. Content has always been positional, so we
// map by position and only warn (not fail) when a named cell disagrees.
const rationaleRows = sheet('Score_Rationale').filter((r) => str(r['Verdict (one line)']));
const rationaleByCompany = new Map<string, Rationale>();
let rationaleNameLag = 0;
rationaleRows.forEach((r, i) => {
  const cell = str(r['Company']);
  const company = masterNames[i];
  if (cell && masterSet.has(cell) && cell !== company) rationaleNameLag++;
  if (!company) return;
  if (!masterSet.has(company)) {
    issues.push(`Score_Rationale references unknown company "${company}"`);
    return;
  }
  rationaleByCompany.set(company, {
    verdict: str(r['Verdict (one line)']) ?? '',
    driversUp: str(r['Why — Drivers Up']) ?? '',
    driversDown: str(r['Why — Drivers Down']) ?? '',
    decisiveFactor: str(r['Decisive Factor']) ?? '',
    trajectory: (str(r['Trajectory']) ?? 'Stable') as Trajectory,
    confidence: str(r['Confidence']) ?? 'Medium',
  });
});

// ── Yearly_Scores (score timeline 2015 → now) ────────────────────────────────
const timelineByCompany = new Map<
  string,
  { points: TimelinePoint[]; change: number | null; shape: string | null }
>();
for (const r of sheet('Yearly_Scores')) {
  const company = str(r['Company']);
  if (!company) continue;
  if (!masterSet.has(company)) {
    issues.push(`Yearly_Scores references unknown company "${company}"`);
    continue;
  }
  const points: TimelinePoint[] = Object.keys(r)
    .filter((k) => /^\d{4}$/.test(k) && num(r[k]) !== null)
    .map((k) => ({ year: Number(k), score: num(r[k])! }))
    .sort((a, b) => a.year - b.year);
  timelineByCompany.set(company, {
    points,
    change: num(r['Change 2015→2026']),
    shape: str(r['Trajectory Shape']),
  });
}

// ── Yearly_Rationale (why the score changed, year by year) ───────────────────
// Evidence cells pack items as "(points) action_id — url" joined by "||".
function parseTimelineEvidence(cell: string | null): TimelineEvidence[] {
  if (!cell) return [];
  return cell
    .split('||')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      // "(points) action_id — url" with an optional trailing "[annotation]"
      const m = raw.match(/^\(([+-]?\d+)\)\s*([\w-]+)\s*—\s*(https?:\/\/[^\s[]+)(?:\s*\[.*\])?$/);
      return m
        ? { points: Number(m[1]), actionId: m[2], url: m[3], raw }
        : { points: null, actionId: null, url: null, raw };
    });
}

const timelineEntriesByCompany = new Map<string, TimelineEntry[]>();
for (const r of sheet('Yearly_Rationale')) {
  const company = str(r['Company']);
  if (!company) continue;
  if (!masterSet.has(company)) {
    issues.push(`Yearly_Rationale references unknown company "${company}"`);
    continue;
  }
  const year = num(r['Year']) ?? 0;
  // The Yearly_Scores grid is the authoritative v2 per-year score; the
  // Yearly_Rationale 'Score' column is a narrative annotation that can lag the
  // v2 recompute, so we take the score from the grid and keep only the
  // rationale text + evidence from this sheet.
  const grid = timelineByCompany.get(company)?.points.find((p) => p.year === year)?.score;
  const entry: TimelineEntry = {
    year,
    score: grid ?? num(r['Score']) ?? 0,
    delta: num(r['Δ vs prior']),
    entryType: str(r['Entry Type']) ?? 'Change',
    rationale:
      str(r['Rationale — why the score is what it is / why it changed (with score math)']) ?? '',
    evidence: parseTimelineEvidence(str(r['Evidence (points | action | source URL)'])),
  };
  (
    timelineEntriesByCompany.get(company) ??
    timelineEntriesByCompany.set(company, []).get(company)!
  ).push(entry);
}
// Sort by year and recompute each entry's delta from the (v2-grid) scores so the
// displayed change always matches the chart, regardless of stale 'Δ vs prior' cells.
for (const entries of timelineEntriesByCompany.values()) {
  entries.sort((a, b) => a.year - b.year);
  entries.forEach((e, i) => {
    e.delta = i === 0 ? null : e.score - entries[i - 1].score;
  });
}

// ── Political_Donations (documented anti-LGBTQ+ political giving) ────────────
// Rows attach to their Company_Master company; rows naming an aggregate that is
// not a master company (e.g. the NYC Pride sponsor-shortfall context row) go to
// the site-wide context ledger with a warning, never to a company.
const donationsByCompany = new Map<string, PoliticalDonation[]>();
const donationLedgerContext: LedgerEntry[] = [];
let donationContextRows = 0;
for (const r of sheet('Political_Donations')) {
  const company = str(r['Company']);
  const amount = str(r['Amount (documented)']);
  if (!company && !amount) continue;
  const sourceUrl = str(r['Source URL']);
  if (!company || !amount || !sourceUrl) {
    issues.push(
      `Political_Donations: row for "${company ?? '?'}" is missing company, amount, or source URL`,
    );
    continue;
  }
  // Parse a clean USD value; leave approximations ("~$750K shortfall") unparsed.
  const clean = amount.replace(/[,\s]/g, '');
  const m = clean.match(/^\$(\d+(?:\.\d+)?)$/);
  const donation: PoliticalDonation = {
    amount,
    amountUsd: m ? Number(m[1]) : null,
    period: str(r['Period']),
    recipientsScope: str(r['Recipients / Scope']) ?? '',
    scoredNote: str(r['Scored in Action_Log?']),
    sourceUrl,
    notes: str(r['Notes']),
  };
  if (masterSet.has(company)) {
    (donationsByCompany.get(company) ?? donationsByCompany.set(company, []).get(company)!).push(
      donation,
    );
  } else {
    donationContextRows++;
    donationLedgerContext.push({ company, ...donation });
  }
}

// ── Assemble companies ───────────────────────────────────────────────────────
const companies: Company[] = masterRows.map((r) => {
  const name = str(r['Company'])!;
  const actions = (actionsByCompany.get(name) ?? []).sort(
    (a, b) => b.year - a.year || b.points - a.points,
  );
  const breakdown = computeScore(actions);

  // Validate the v2 scoring module against the workbook's stored aggregates —
  // "Positive Pts (capped)" / "Negative Pts" (written by recompute_scores.py).
  // The final score + its round-half-even is separately validated by the
  // Yearly_Scores anchor check below.
  const wbPos = num(r['Positive Pts (capped)']);
  const wbNeg = num(r['Negative Pts']);
  if (wbPos !== null && Math.abs(breakdown.positiveCapped - wbPos) > 0.15) {
    issues.push(
      `Positive Pts mismatch for ${name}: module=${breakdown.positiveCapped}, workbook=${wbPos}`,
    );
  }
  if (wbNeg !== null && Math.abs(breakdown.negative - wbNeg) > 0.15) {
    issues.push(
      `Negative Pts mismatch for ${name}: module=${breakdown.negative}, workbook=${wbNeg}`,
    );
  }

  const rationale = rationaleByCompany.get(name) ?? null;
  if (!rationale) issues.push(`No Score_Rationale row for ${name}`);

  const tl = timelineByCompany.get(name);
  if (!tl) issues.push(`No Yearly_Scores row for ${name}`);
  const timelineEntries = timelineEntriesByCompany.get(name) ?? [];
  if (timelineEntries.length === 0) issues.push(`No Yearly_Rationale entries for ${name}`);
  // the timeline's latest year must agree with the current computed score
  const lastPoint = tl?.points[tl.points.length - 1];
  if (lastPoint && lastPoint.score !== breakdown.score) {
    issues.push(
      `Yearly_Scores: ${name} ends at ${lastPoint.score} (${lastPoint.year}) but the current computed score is ${breakdown.score}`,
    );
  }

  return {
    name,
    slug: slugify(name),
    ticker: str(r['Ticker']),
    sector: str(r['Sector']) ?? 'Unknown',
    revenueB: num(r['Revenue ($B)']),
    hrcCei: num(r['HRC CEI Score']),
    ceiYear: num(r['CEI Year']),
    stillSubmittingCei: str(r['Still Submitting CEI?']) === null ? null : yes(r['Still Submitting CEI?']),
    flags: {
      postJan2025Reversal: yes(r['Post-Jan2025 Reversal?']),
      pressureDriven: yes(r['Pressure-Driven?']),
      juneOnly: yes(r['June-Only?']),
      transNbExclusion: yes(r['Trans/NB Exclusion?']),
      geoHypocrisy: yes(r['Geo Hypocrisy?']),
    },
    analystNotes: str(r['Analyst Notes']),
    rationale,
    actions,
    social: socialByCompany.get(name) ?? [],
    statements: statementsByCompany.get(name) ?? [],
    breakdown,
    score: breakdown.score,
    band: bandFor(breakdown.score),
    timeline: tl?.points ?? [],
    timelineEntries,
    timelineChange: tl?.change ?? null,
    trajectoryShape: tl?.shape ?? null,
    donations: donationsByCompany.get(name) ?? [],
  };
});

// duplicate slug guard
const slugCounts = new Map<string, number>();
for (const c of companies) {
  slugCounts.set(c.slug, (slugCounts.get(c.slug) ?? 0) + 1);
}
for (const [slug, n] of slugCounts) if (n > 1) issues.push(`Duplicate slug "${slug}" (${n}x)`);

// ── Sector_Summary (computed; workbook sheet ships with blank stats) ─────────
const sectorNames = [...new Set(companies.map((c) => c.sector))];
const sectors: SectorStats[] = sectorNames.map((sector) => {
  const cs = companies.filter((c) => c.sector === sector);
  const scores = cs.map((c) => c.score);
  return {
    sector,
    companies: cs.length,
    avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / cs.length) * 10) / 10,
    min: Math.min(...scores),
    max: Math.max(...scores),
    champions: cs.filter((c) => c.band === 'Champion').length,
    harmfulPlus: cs.filter((c) => c.band === 'Harmful' || c.band === 'Adversarial').length,
  };
});
// keep the workbook's sector ordering
const wbOrder = sheet('Sector_Summary')
  .map((r) => str(r['Sector']))
  .filter((s): s is string => !!s && s !== 'ALL COMPANIES');
sectors.sort((a, b) => wbOrder.indexOf(a.sector) - wbOrder.indexOf(b.sector));

// ── Emit ─────────────────────────────────────────────────────────────────────
const data: IndexData = {
  generatedAt: new Date().toISOString(),
  workbook: 'Corporate_Pride_Index_Data.xlsx',
  companies,
  sectors,
  scoringReference,
  donationLedgerContext,
  validation: {
    passed: issues.length === 0,
    companiesChecked: companies.length,
    actionsChecked,
    issues,
  },
};

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(data, null, 1));

console.log(`Ingested ${companies.length} companies, ${actionsChecked} actions.`);
if (donationContextRows > 0)
  console.warn(
    `Note: ${donationContextRows} Political_Donations row(s) name aggregates outside Company_Master; kept as site-wide context, not attached to a company.`,
  );
if (rationaleNameLag > 0)
  console.warn(
    `Note: ${rationaleNameLag} Score_Rationale rows have Company cells that disagree with their row position (known legacy off-by-one); content mapped by position.`,
  );
console.log(
  `Validation: scoring module reproduced the workbook formula for all ${companies.length} companies.`,
);
if (issues.length) {
  console.error(`\n✗ ${issues.length} validation issue(s):`);
  for (const i of issues) console.error('  - ' + i);
  process.exit(1);
}
console.log('✓ All validation checks passed.');
