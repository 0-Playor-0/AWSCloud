import React from 'react';

import { healthScore, SCORE_WEIGHTS, scoreBand, type ScoreBand, type SeverityCounts } from '../lib/healthScore';

const BAND: Record<ScoreBand, { label: string; color: string }> = {
  ready: { label: 'Ready', color: '#1f7a4d' },
  needs_fixes: { label: 'Needs fixes', color: '#8a5a00' },
  likely_rejected: { label: 'Likely rejected', color: '#b02a24' },
};

const R = 34;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** Identity Health Score ring with band label and a "how it's calculated" note. */
export const HealthScore: React.FC<{ counts?: SeverityCounts }> = ({ counts }) => {
  if (!counts) {
    return (
      <div data-testid="health-score" className="flex min-w-[9rem] flex-col justify-center text-center">
        <div className="font-mono text-[10px] uppercase tracking-wider text-[#14213d]/70">Health score</div>
        <p className="mt-1 text-[11px] leading-snug text-[#14213d]/75">Appears after you run the check.</p>
      </div>
    );
  }
  const score = healthScore(counts);
  const band = BAND[scoreBand(score)];
  return (
    <div data-testid="health-score" className="flex min-w-[9rem] flex-col items-center text-center">
      <div className="font-mono text-[10px] uppercase tracking-wider text-[#14213d]/70">Health score</div>
      <div className="relative mt-1 h-[84px] w-[84px]">
        <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="42" cy="42" r={R} fill="none" stroke="#14213d" strokeOpacity="0.12" strokeWidth="8" />
          <circle
            cx="42" cy="42" r={R} fill="none" stroke={band.color} strokeWidth="8" strokeLinecap="butt"
            strokeDasharray={`${(CIRCUMFERENCE * score) / 100} ${CIRCUMFERENCE}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span data-testid="health-score-value" className="font-sans text-2xl font-extrabold tabular-nums text-[#14213d]">
            {score}
          </span>
        </div>
      </div>
      <div className="mt-1 font-mono text-[11px] font-bold uppercase tracking-wider" style={{ color: band.color }}>
        <span className="sr-only">Identity Health Score {score} out of 100: </span>
        {band.label}
      </div>
      <p className="mt-1 text-[10.5px] leading-snug text-[#14213d]/75">Our estimate, not an official score.</p>
      <details className="mt-1 text-left text-[11px] text-[#14213d]/80">
        <summary className="min-h-[44px] cursor-pointer py-3 underline decoration-[#14213d]/40">
          How it's calculated
        </summary>
        <p className="leading-snug">
          100 − {SCORE_WEIGHTS.blocking} per blocking difference − {SCORE_WEIGHTS.risky} per risky −{' '}
          {SCORE_WEIGHTS.cosmetic} per cosmetic, never below 0. Ready 90–100, Needs fixes 60–89, Likely
          rejected below 60. 100 means every compared field matches.
        </p>
      </details>
    </div>
  );
};
