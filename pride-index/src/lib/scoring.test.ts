import { describe, expect, it } from 'vitest';
import {
  BASELINE,
  COSMETIC_COMMERCIAL_CAP,
  bandFor,
  computeScore,
  type ScorableAction,
} from './scoring';

const a = (tier: string, polarity: string, points: number): ScorableAction => ({
  tier,
  polarity,
  points,
});

describe('bandFor — band thresholds (boundaries are inclusive at the floor)', () => {
  it.each([
    [100, 'Champion'],
    [80, 'Champion'],
    [79, 'Ally'],
    [65, 'Ally'],
    [64, 'Neutral'],
    [50, 'Neutral'],
    [49, 'Performative'],
    [35, 'Performative'],
    [34, 'Harmful'],
    [20, 'Harmful'],
    [19, 'Adversarial'],
    [0, 'Adversarial'],
  ])('score %i → %s', (score, band) => {
    expect(bandFor(score)).toBe(band);
  });
});

describe('computeScore', () => {
  it('a company with no actions holds the neutral baseline of 50', () => {
    const b = computeScore([]);
    expect(b.score).toBe(BASELINE);
    expect(b.band).toBe('Neutral');
    expect(b.positiveCapped).toBe(0);
    expect(b.negative).toBe(0);
  });

  it('caps Cosmetic + Commercial at +20 (the rainbow-washing cap)', () => {
    const b = computeScore([
      a('Cosmetic', 'Positive', 15),
      a('Commercial', 'Positive', 15),
    ]);
    expect(b.cosmeticCommercialRaw).toBe(30);
    expect(b.cosmeticCommercialCapped).toBe(COSMETIC_COMMERCIAL_CAP);
    // 50 + min(20, 30) = 70, not 80
    expect(b.score).toBe(70);
  });

  it('does not cap Civic / Financial / Structural tiers', () => {
    const b = computeScore([
      a('Civic', 'Positive', 15),
      a('Financial', 'Positive', 15),
      a('Structural', 'Positive', 15),
    ]);
    expect(b.civic).toBe(15);
    expect(b.financial).toBe(15);
    expect(b.structural).toBe(15);
    expect(b.positiveCapped).toBe(45);
    expect(b.score).toBe(95);
  });

  it('clamps the final score to 100', () => {
    const b = computeScore([
      a('Cosmetic', 'Positive', 20),
      a('Civic', 'Positive', 40),
      a('Structural', 'Positive', 40),
    ]);
    // 50 + 20 + 40 + 40 = 150 → clamped
    expect(b.score).toBe(100);
    expect(b.band).toBe('Champion');
  });

  it('clamps the final score to 0 (negatives are uncapped)', () => {
    const b = computeScore([a('—', 'Negative', -80), a('—', 'Negative', -40)]);
    expect(b.negative).toBe(-120);
    // 50 - 120 = -70 → clamped
    expect(b.score).toBe(0);
    expect(b.band).toBe('Adversarial');
  });

  it('applies reversal asymmetry: a single negative outweighs capped cosmetic gains', () => {
    const cosmeticOnly = computeScore([
      a('Cosmetic', 'Positive', 10),
      a('Commercial', 'Positive', 10),
    ]);
    const withReversal = computeScore([
      a('Cosmetic', 'Positive', 10),
      a('Commercial', 'Positive', 10),
      a('—', 'Negative', -40),
    ]);
    expect(cosmeticOnly.score).toBe(70); // 50 + 20
    expect(withReversal.score).toBe(30); // 50 + 20 - 40
    expect(withReversal.band).toBe('Harmful'); // 30 is in the 20–34 band
  });

  it('only counts Positive points toward tier subtotals', () => {
    // A negative-polarity row in a positive tier must not add to that tier.
    const b = computeScore([a('Civic', 'Negative', -10)]);
    expect(b.civic).toBe(0);
    expect(b.negative).toBe(-10);
    expect(b.score).toBe(40);
  });
});
