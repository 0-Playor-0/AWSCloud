// Remove long identifier-like digit runs on the device before any OCR text is sent.
import type { RecognizedLine } from './ocr';

export const MAX_LINES = 40;
export const MAX_LINE_CHARS = 120;

const GROUPED_12 = /\d{4}[\s-]+\d{4}[\s-]+\d{4}/g;
const LONG_RUN = /\d{9,}/g;

export interface SanitizedText {
  lines: RecognizedLine[];
  removedNumbers: number;
}

export function sanitizeLines(raw: RecognizedLine[]): SanitizedText {
  let removedNumbers = 0;
  const strip = (text: string, pattern: RegExp) =>
    text.replace(pattern, () => {
      removedNumbers += 1;
      return ' ';
    });

  const lines = raw
    .map((line) => ({
      ...line,
      text: strip(strip(line.text, GROUPED_12), LONG_RUN)
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, MAX_LINE_CHARS),
    }))
    .filter((line) => line.text.length > 0)
    .slice(0, MAX_LINES);

  return { lines, removedNumbers };
}
