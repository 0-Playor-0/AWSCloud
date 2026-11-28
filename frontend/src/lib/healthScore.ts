// Identity Health Score: our estimate from the backend's finding counts, not an official score.

export interface SeverityCounts {
  blocking: number;
  risky: number;
  cosmetic: number;
}

export type ScoreBand = 'ready' | 'needs_fixes' | 'likely_rejected';

export const SCORE_WEIGHTS = { blocking: 25, risky: 10, cosmetic: 2 } as const;

/** 100 − 25 per blocking − 10 per risky − 2 per cosmetic, floored at 0. */
export function healthScore(counts: SeverityCounts): number {
  const penalty =
    SCORE_WEIGHTS.blocking * counts.blocking +
    SCORE_WEIGHTS.risky * counts.risky +
    SCORE_WEIGHTS.cosmetic * counts.cosmetic;
  return Math.max(0, 100 - penalty);
}

/** Ready 90–100 · Needs fixes 60–89 · Likely rejected below 60. */
export function scoreBand(score: number): ScoreBand {
  if (score >= 90) return 'ready';
  if (score >= 60) return 'needs_fixes';
  return 'likely_rejected';
}
