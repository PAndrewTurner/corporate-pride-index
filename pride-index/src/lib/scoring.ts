/**
 * The standalone scoring module — Corporate Pride Index, Methodology v2.
 *
 * Reproduces the workbook's v2.1 formula exactly:
 *
 *   score = clamp(0, 100, roundHalfEven(
 *             50                                                    // neutral baseline
 *           + min(20, cosmetic + commercial)                        // capped "signaling"
 *           + diminish(civic + financial + structural) × engage     // substantive positives
 *           + diminish(negatives) ))                                // negatives
 *
 * v2's defining feature is DIMINISHING RETURNS: within the substantive-positive
 * pool and within the negative pool, actions are sorted by magnitude (largest
 * first) and each successive action is multiplied by a decreasing weight, so the
 * single most significant action on each side carries full weight and additional
 * similar actions count for progressively less. The Cosmetic + Commercial
 * "signaling" subtotal is capped at +20 and is NOT diminished.
 *
 * v2.1 adds the ENGAGEMENT FACTOR (visibility-adjusted substance): the diminished
 * substantive subtotal is scaled by 0.85 for companies that have no public-facing
 * engagement at all — i.e. no Commercial (merch/collab) and no Civic (parade/ERG/
 * community) action — so that internal-only substance scores below otherwise-equal
 * "do AND show" companies. This is the symmetric counterpart to the pride-washing
 * penalty (visible signaling without substance): substance without visibility. A
 * bare Cosmetic action (logo/post/flag) is too cheap to count as engagement.
 *
 * Aggregates match the workbook's stored "Positive Pts (capped)" / "Negative
 * Pts" values (rounded to 1 decimal), and the final score matches the Yearly
 * series anchor (round-half-to-even, as produced by the Python recompute).
 *
 * Used by the build-time ingest (which asserts the derived values match the
 * workbook) and by the Methodology page's worked examples, so the published
 * methodology and the shipped numbers can never drift apart.
 */

import type { Band, ScoreBreakdown } from './types';

export const COSMETIC_COMMERCIAL_CAP = 20;
export const BASELINE = 50;

/** v2.1 engagement factor: substance multiplier when a company has no public engagement. */
export const ENGAGEMENT_FACTOR = 0.85;

/** Tiers that count as genuine public engagement (doing something public, not just a logo). */
const PUBLIC_ENGAGEMENT = ['Commercial', 'Civic'];

/** Diminishing-returns weights by position (largest action first); 8th+ = 0.05. */
export const DIMINISH_WEIGHTS = [1.0, 0.7, 0.5, 0.35, 0.25, 0.15, 0.1] as const;
const weightAt = (i: number): number => (i < DIMINISH_WEIGHTS.length ? DIMINISH_WEIGHTS[i] : 0.05);

export interface ScorableAction {
  tier: string;
  polarity: string;
  points: number;
}

export const BAND_THRESHOLDS: { band: Band; min: number; max: number }[] = [
  { band: 'Champion', min: 80, max: 100 },
  { band: 'Ally', min: 65, max: 79 },
  { band: 'Neutral', min: 50, max: 64 },
  { band: 'Performative', min: 35, max: 49 },
  { band: 'Harmful', min: 20, max: 34 },
  { band: 'Adversarial', min: 0, max: 19 },
];

export function bandFor(score: number): Band {
  if (score >= 80) return 'Champion';
  if (score >= 65) return 'Ally';
  if (score >= 50) return 'Neutral';
  if (score >= 35) return 'Performative';
  if (score >= 20) return 'Harmful';
  return 'Adversarial';
}

const round1 = (x: number): number => Math.round(x * 10) / 10;

/** Round half to even (banker's rounding), matching the Python recompute. */
function roundHalfEven(x: number): number {
  const f = Math.floor(x);
  const d = x - f;
  if (Math.abs(d - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
  return Math.round(x);
}

/** Apply diminishing-returns weights to a pool of point values (sorted by magnitude). */
export function diminish(points: number[]): number {
  return [...points]
    .sort((a, b) => Math.abs(b) - Math.abs(a))
    .reduce((sum, v, i) => sum + v * weightAt(i), 0);
}

const sumTier = (actions: ScorableAction[], tier: string): number =>
  actions.filter((a) => a.tier === tier && a.polarity === 'Positive').reduce((s, a) => s + a.points, 0);

const SUBSTANTIVE = ['Civic', 'Financial', 'Structural'];

/**
 * 1.0 if the company has any public-facing (Commercial or Civic) positive action, else 0.85.
 * Companies with only internal substance (Financial/Structural) — or only cheap Cosmetic
 * signaling — score their substance at a discount.
 */
export function engagementFactorFor(actions: ScorableAction[]): number {
  const hasPublic = actions.some(
    (a) => a.polarity === 'Positive' && PUBLIC_ENGAGEMENT.includes(a.tier),
  );
  return hasPublic ? 1.0 : ENGAGEMENT_FACTOR;
}

export function computeScore(actions: ScorableAction[]): ScoreBreakdown {
  const cosmetic = sumTier(actions, 'Cosmetic');
  const commercial = sumTier(actions, 'Commercial');
  const cosmeticCommercialRaw = cosmetic + commercial;
  const cosmeticCommercialCapped = Math.min(COSMETIC_COMMERCIAL_CAP, cosmeticCommercialRaw);

  const civic = sumTier(actions, 'Civic');
  const financial = sumTier(actions, 'Financial');
  const structural = sumTier(actions, 'Structural');

  // Substantive positives — diminishing returns across the combined pool.
  const substPoints = actions
    .filter((a) => a.polarity === 'Positive' && SUBSTANTIVE.includes(a.tier))
    .map((a) => a.points);
  const substantiveRaw = civic + financial + structural;
  const substantiveDiminished = round1(diminish(substPoints));

  // Engagement factor (v2.1): discount internal-only substance (no Commercial/Civic action).
  const engagementFactor = engagementFactorFor(actions);

  // Negatives — diminishing returns across the negative pool (never capped).
  const negPoints = actions.filter((a) => a.polarity === 'Negative').map((a) => a.points);
  const negativeRaw = negPoints.reduce((s, p) => s + p, 0);
  const negative = round1(diminish(negPoints));

  // "Positive Pts (capped)" stored aggregate: capped signaling + engagement-adjusted substance.
  const positiveCapped = round1(cosmeticCommercialCapped + diminish(substPoints) * engagementFactor);

  const score = Math.max(0, Math.min(100, roundHalfEven(BASELINE + positiveCapped + negative)));

  return {
    cosmeticCommercialRaw,
    cosmeticCommercialCapped,
    civic,
    financial,
    structural,
    substantiveRaw,
    substantiveDiminished,
    engagementFactor,
    positiveCapped,
    negativeRaw,
    negative,
    score,
    band: bandFor(score),
  };
}
