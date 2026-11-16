// Runs on the device before any text is sent (HANDOFF.md 4.3): long digit runs could be an
// Aadhaar, account or other ID number, so they are removed. Dates (at most 4 digits in a row)
// are kept. The server's ID guard checks again (defence in depth).

export const MAX_LINES = 40;
export const MAX_LINE_CHARS = 120;

const GROUPED_12 = /\d{4}[\s-]+\d{4}[\s-]+\d{4}/g; // 4-4-4, spaces or hyphens
const LONG_RUN = /\d{9,}/g;

export interface SanitizedText {
  lines: string[];
  removedNumbers: number;
}

export function sanitizeLines(raw: string[]): SanitizedText {
  let removedNumbers = 0;
  const strip = (s: string, re: RegExp) =>
    s.replace(re, () => {
      removedNumbers += 1;
      return " ";
    });
  const lines = raw
    .map((l) => strip(strip(l, GROUPED_12), LONG_RUN).replace(/\s+/g, " ").trim().slice(0, MAX_LINE_CHARS))
    .filter((l) => l.length > 0)
    .slice(0, MAX_LINES);
  return { lines, removedNumbers };
}
