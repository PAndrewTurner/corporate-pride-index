import { describe, expect, it } from 'vitest';
import { BASELINE, bandFor, computeScore, diminish, type ScorableAction } from './scoring';

const a = (tier: string, polarity: string, points: number): ScorableAction => ({ tier, polarity, points });
const pos = (tier: string, points: number) => a(tier, 'Positive', points);
const neg = (points: number) => a('—', 'Negative', points);

describe('bandFor — band thresholds', () => {
  it.each([
    [100, 'Champion'], [80, 'Champion'], [79, 'Ally'], [65, 'Ally'], [64, 'Neutral'], [50, 'Neutral'],
    [49, 'Performative'], [35, 'Performative'], [34, 'Harmful'], [20, 'Harmful'], [19, 'Adversarial'], [0, 'Adversarial'],
  ])('score %i → %s', (score, band) => expect(bandFor(score)).toBe(band));
});

describe('diminish — diminishing-returns weights (1.0, 0.7, 0.5, 0.35, …)', () => {
  it('weights actions largest-first regardless of input order', () => {
    expect(diminish([15, 25, 22])).toBeCloseTo(25 * 1.0 + 22 * 0.7 + 15 * 0.5, 5); // 47.9
  });
  it('applies symmetrically to negatives by magnitude', () => {
    expect(diminish([-22, -32, -30])).toBeCloseTo(-32 * 1.0 + -30 * 0.7 + -22 * 0.5, 5); // -64
  });
  it('a single action carries full weight', () => {
    expect(diminish([-32])).toBe(-32);
  });
});

describe('computeScore (v2)', () => {
  it('no actions hold the neutral baseline of 50', () => {
    const b = computeScore([]);
    expect(b.score).toBe(BASELINE);
    expect(b.band).toBe('Neutral');
  });

  it('caps Cosmetic + Commercial signaling at +20 (not diminished)', () => {
    const b = computeScore([pos('Cosmetic', 15), pos('Commercial', 15)]);
    expect(b.cosmeticCommercialRaw).toBe(30);
    expect(b.cosmeticCommercialCapped).toBe(20);
    expect(b.score).toBe(70); // 50 + 20
  });

  it('applies diminishing returns to substantive positives', () => {
    // sorted [25, 22, 15] → 25 + 15.4 + 7.5 = 47.9
    const b = computeScore([pos('Structural', 25), pos('Financial', 22), pos('Civic', 15)]);
    expect(b.substantiveDiminished).toBe(47.9);
    expect(b.score).toBe(98); // roundHalfEven(50 + 47.9 = 97.9)
    expect(b.band).toBe('Champion');
  });

  it('single decisive reverser: first negative at full weight pulls below baseline', () => {
    // positives [22,15,12] → 38.5 ; negatives [-32] → -32 ; 50+38.5-32 = 56.5 → 56 (even)
    const b = computeScore([
      pos('Structural', 22), pos('Civic', 15), pos('Civic', 12), neg(-32),
    ]);
    expect(b.substantiveDiminished).toBe(38.5);
    expect(b.negative).toBe(-32);
    expect(b.score).toBe(56);
    expect(b.band).toBe('Neutral');
  });

  it('stacked reverser stays distinct from the floor (diminished negatives)', () => {
    // cosmetic [3,2]=5 ; substantive [15,12]=23.4 ; negatives [-32,-30,-22]=-64
    // 50 + 5 + 23.4 - 64 = 14.4 → 14
    const b = computeScore([
      pos('Cosmetic', 3), pos('Cosmetic', 2), pos('Civic', 15), pos('Civic', 12),
      neg(-32), neg(-30), neg(-22),
    ]);
    expect(b.negative).toBe(-64);
    expect(b.score).toBe(14);
    expect(b.band).toBe('Adversarial');
  });

  it('clamps to 0 and 100', () => {
    expect(computeScore([pos('Structural', 28), pos('Structural', 25), pos('Financial', 25), pos('Civic', 15)]).score).toBe(100);
    expect(computeScore([neg(-40), neg(-35), neg(-32), neg(-30)]).score).toBe(0);
  });

  it('uses round-half-to-even on the final score', () => {
    // substantive single 34.5 → 50 + 34.5 = 84.5 → 84 (even)
    expect(computeScore([pos('Structural', 34.5)]).score).toBe(84);
  });
});
