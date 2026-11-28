import { describe, expect, it } from 'vitest';

import { healthScore, scoreBand } from './healthScore';

describe('healthScore', () => {
  it.each([
    // blocking, risky, cosmetic, score
    [0, 0, 0, 100],
    [0, 0, 1, 98],
    [0, 0, 5, 90],
    [0, 1, 0, 90],
    [1, 0, 0, 75],
    [1, 1, 1, 63],
    [2, 2, 0, 30],
    [4, 0, 0, 0],
    [3, 3, 3, 0], // 100 - 75 - 30 - 6 < 0 → floored
    [10, 10, 10, 0],
  ])('%i blocking, %i risky, %i cosmetic → %i', (blocking, risky, cosmetic, score) => {
    expect(healthScore({ blocking, risky, cosmetic })).toBe(score);
  });
});

describe('scoreBand edges', () => {
  it.each([
    [100, 'ready'],
    [90, 'ready'],
    [89, 'needs_fixes'],
    [60, 'needs_fixes'],
    [59, 'likely_rejected'],
    [0, 'likely_rejected'],
  ] as const)('%i → %s', (score, band) => {
    expect(scoreBand(score)).toBe(band);
  });
});
