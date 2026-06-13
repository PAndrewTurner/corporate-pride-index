import raw from '../data/index-data.json';
import type { Band, Company, IndexData } from './types';

export const data = raw as unknown as IndexData;
export const companies = data.companies;
export const sectors = data.sectors;
export const scoringReference = data.scoringReference;

export const companyBySlug = new Map(companies.map((c) => [c.slug, c]));

/** Same slug rules the ingest applies to company names. */
export const slugifySector = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const sectorBySlug = new Map(sectors.map((s) => [slugifySector(s.sector), s]));

/** Median of a numeric list (robust to outliers, unlike the mean). */
export const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round(((s[mid - 1] + s[mid]) / 2) * 10) / 10;
};

export interface SectorTimelinePoint {
  year: number;
  avg: number;
  median: number;
  count: number;
}

/** Aggregate the per-company yearly timelines into a sector-level series. */
export function sectorTimeline(sectorName: string): SectorTimelinePoint[] {
  const cs = companies.filter((c) => c.sector === sectorName);
  const years = new Set<number>();
  cs.forEach((c) => c.timeline.forEach((p) => years.add(p.year)));
  return [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const scores = cs
        .map((c) => c.timeline.find((p) => p.year === year)?.score)
        .filter((s): s is number => s !== undefined);
      return {
        year,
        avg: scores.length
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : 0,
        median: median(scores),
        count: scores.length,
      };
    });
}

/** Companies in a sector, sorted by current score (desc). */
export const companiesInSector = (sectorName: string) =>
  companies.filter((c) => c.sector === sectorName).sort((a, b) => b.score - a.score);

export const BAND_COLORS: Record<Band, string> = {
  Champion: '#10b981',
  Ally: '#84cc16',
  Neutral: '#eab308',
  Performative: '#f97316',
  Harmful: '#ef4444',
  Adversarial: '#991b1b',
};

export const BAND_ORDER: Band[] = [
  'Champion',
  'Ally',
  'Neutral',
  'Performative',
  'Harmful',
  'Adversarial',
];

export const FLAG_LABELS: { key: keyof Company['flags']; label: string; short: string }[] = [
  { key: 'postJan2025Reversal', label: 'Post-Jan 2025 Reversal', short: 'Reversal' },
  { key: 'pressureDriven', label: 'Pressure-Driven Retreat', short: 'Pressure-Driven' },
  { key: 'juneOnly', label: 'June-Only Support', short: 'June-Only' },
  { key: 'transNbExclusion', label: 'Trans / Non-Binary Exclusion', short: 'Trans/NB Exclusion' },
  { key: 'geoHypocrisy', label: 'Geographic Hypocrisy', short: 'Geo Hypocrisy' },
];

/** Position (0–100) → percentage along the gradient bar. */
export const scorePct = (score: number) => Math.max(0, Math.min(100, score));

export const fmtPts = (n: number) => (n > 0 ? `+${n}` : `${n}`);
