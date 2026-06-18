/**
 * sync-workbook.ts — regenerate the workbook's stored scoring aggregates from the
 * authoritative TypeScript scoring module (src/lib/scoring.ts).
 *
 * The Methodology references Python scripts (recompute_scores.py / yearly_recompute.py)
 * that do not live in this repo. With Methodology v2.1 (the engagement factor),
 * `scoring.ts` is the single source of truth; this script pushes its results back into
 * `Corporate_Pride_Index_Data.xlsx` so the build-time ingest cross-check still passes:
 *
 *   • Company_Master:  "Positive Pts (capped)"  ← breakdown.positiveCapped
 *                      "Negative Pts"           ← breakdown.negative
 *   • Yearly_Scores:   each YEAR column          ← cumulative score from actions dated ≤ year
 *                      "Change 2015→2026"        ← last-year − first-year
 *
 * Final Score / Band remain LIVE Excel formulas reading those stored cells — they are
 * not touched here and recompute when the workbook is opened. Only the specific value
 * cells above are mutated; every other cell (including formulas) round-trips untouched.
 *
 * Run after any edit to scoring.ts or the Action_Log, BEFORE `npm run ingest`.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { computeScore, type ScorableAction } from '../src/lib/scoring';

const __dir = dirname(fileURLToPath(import.meta.url));
const WORKBOOK_PATH = resolve(__dir, '../../Corporate_Pride_Index_Data.xlsx');

const wb = XLSX.read(readFileSync(WORKBOOK_PATH), { type: 'buffer', cellFormula: true, cellStyles: true });

const str = (v: unknown): string | null =>
  v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim();
const num = (v: unknown): number | null => {
  const s = str(v);
  if (s === null) return null;
  const n = Number(s.replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
};

function ws(name: string): XLSX.WorkSheet {
  const sheet = wb.Sheets[name];
  if (!sheet) throw new Error(`Workbook is missing sheet "${name}"`);
  return sheet;
}

/** Map header name → column index, reading the sheet's first (header) row. */
function headerCols(sheet: XLSX.WorkSheet): { range: XLSX.Range; cols: Map<string, number> } {
  const range = XLSX.utils.decode_range(sheet['!ref']!);
  const cols = new Map<string, number>();
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
    const name = str(cell?.v);
    if (name) cols.set(name, c);
  }
  return { range, cols };
}

function cellVal(sheet: XLSX.WorkSheet, r: number, c: number): unknown {
  return sheet[XLSX.utils.encode_cell({ r, c })]?.v;
}

/** Set a numeric value cell, replacing any prior value/formula at that address. */
function setNum(sheet: XLSX.WorkSheet, r: number, c: number, v: number): void {
  sheet[XLSX.utils.encode_cell({ r, c })] = { t: 'n', v };
}

// ── Build actions per company from Action_Log ────────────────────────────────
interface YearAction extends ScorableAction {
  year: number;
}
const actionsByCompany = new Map<string, YearAction[]>();
{
  const sheet = ws('Action_Log');
  const { range, cols } = headerCols(sheet);
  const need = ['Company', 'Tier', 'Polarity', 'Points', 'Year'];
  for (const n of need) if (!cols.has(n)) throw new Error(`Action_Log missing column "${n}"`);
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const company = str(cellVal(sheet, r, cols.get('Company')!));
    if (!company) continue;
    const tier = str(cellVal(sheet, r, cols.get('Tier')!)) ?? '—';
    const polarity = str(cellVal(sheet, r, cols.get('Polarity')!)) ?? 'Positive';
    const points = num(cellVal(sheet, r, cols.get('Points')!)) ?? 0;
    const year = num(cellVal(sheet, r, cols.get('Year')!)) ?? 0;
    const list = actionsByCompany.get(company) ?? [];
    list.push({ tier, polarity, points, year });
    actionsByCompany.set(company, list);
  }
}

const actionsFor = (company: string): YearAction[] => actionsByCompany.get(company) ?? [];

// ── Update Company_Master: Positive Pts (capped) + Negative Pts ──────────────
let masterUpdated = 0;
{
  const sheet = ws('Company_Master');
  const { range, cols } = headerCols(sheet);
  const posCol = cols.get('Positive Pts (capped)');
  const negCol = cols.get('Negative Pts');
  const companyCol = cols.get('Company');
  if (posCol === undefined || negCol === undefined || companyCol === undefined)
    throw new Error('Company_Master missing Company / Positive Pts (capped) / Negative Pts column');
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const company = str(cellVal(sheet, r, companyCol));
    if (!company) continue;
    const b = computeScore(actionsFor(company));
    setNum(sheet, r, posCol, b.positiveCapped);
    setNum(sheet, r, negCol, b.negative);
    masterUpdated++;
  }
}

// ── Update Yearly_Scores: cumulative per-year scores + Change ────────────────
let yearlyUpdated = 0;
{
  const sheet = ws('Yearly_Scores');
  const { range, cols } = headerCols(sheet);
  const companyCol = cols.get('Company');
  if (companyCol === undefined) throw new Error('Yearly_Scores missing Company column');
  const yearCols = [...cols.entries()]
    .filter(([k]) => /^\d{4}$/.test(k))
    .map(([k, c]) => ({ year: Number(k), c }))
    .sort((a, b) => a.year - b.year);
  if (yearCols.length === 0) throw new Error('Yearly_Scores has no year columns');
  const changeCol = [...cols.entries()].find(([k]) => /^Change\b/.test(k))?.[1];

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const company = str(cellVal(sheet, r, companyCol));
    if (!company) continue;
    const acts = actionsFor(company);
    let first: number | null = null;
    let last = 0;
    for (const { year, c } of yearCols) {
      const score = computeScore(acts.filter((a) => a.year <= year)).score;
      setNum(sheet, r, c, score);
      if (first === null) first = score;
      last = score;
    }
    if (changeCol !== undefined && first !== null) setNum(sheet, r, changeCol, last - first);
    yearlyUpdated++;
  }
}

// ── Write back, preserving untouched cells (incl. live formulas) ─────────────
const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
writeFileSync(WORKBOOK_PATH, out);
console.log(
  `sync-workbook: updated ${masterUpdated} Company_Master rows and ${yearlyUpdated} Yearly_Scores rows → ${WORKBOOK_PATH}`,
);
