/**
 * The standalone scoring module.
 *
 * Reproduces the workbook's scoring formula exactly:
 *
 *   score = clamp(50 + min(20, cosmetic + commercial) + civic + financial + structural + negative, 0, 100)
 *
 * Positive points are summed per tier; the Cosmetic + Commercial subtotal is
 * capped at +20 (the "rainbow-washing cap"). Negative points (always tier "—")
 * are summed by polarity and are uncapped — reversal asymmetry by design.
 *
 * This module is used both by the build-time ingestion pipeline (which asserts
 * the derived score matches the workbook's formula for every company) and by
 * the Methodology page's worked example, so the published methodology and the
 * shipped numbers can never drift apart.
 */

import type { Band, ScoreBreakdown } from './types';

export const COSMETIC_COMMERCIAL_CAP = 20;
export const BASELINE = 50;

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

function sumTier(actions: ScorableAction[], tier: string): number {
  return actions
    .filter((a) => a.tier === tier && a.polarity === 'Positive')
    .reduce((s, a) => s + a.points, 0);
}

export function computeScore(actions: ScorableAction[]): ScoreBreakdown {
  const cosmetic = sumTier(actions, 'Cosmetic');
  const commercial = sumTier(actions, 'Commercial');
  const cosmeticCommercialRaw = cosmetic + commercial;
  const cosmeticCommercialCapped = Math.min(COSMETIC_COMMERCIAL_CAP, cosmeticCommercialRaw);
  const civic = sumTier(actions, 'Civic');
  const financial = sumTier(actions, 'Financial');
  const structural = sumTier(actions, 'Structural');
  const negative = actions
    .filter((a) => a.polarity === 'Negative')
    .reduce((s, a) => s + a.points, 0);

  const positiveCapped = cosmeticCommercialCapped + civic + financial + structural;
  const raw = BASELINE + positiveCapped + negative;
  const score = Math.max(0, Math.min(100, raw));

  return {
    cosmeticCommercialRaw,
    cosmeticCommercialCapped,
    civic,
    financial,
    structural,
    positiveCapped,
    negative,
    score,
    band: bandFor(score),
  };
}
