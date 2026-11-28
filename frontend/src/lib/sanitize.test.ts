import assert from 'node:assert/strict';
import test from 'node:test';

import { MAX_LINE_CHARS, MAX_LINES, sanitizeLines } from './sanitize';

test('removes identifier-like numbers before text can leave the device', () => {
  const result = sanitizeLines([
    { text: 'Aadhaar: 9999 9999 9999', confidence: 0.9 },
    { text: 'Account 123456789', confidence: 0.8 },
    { text: 'DOB: 14/03/2007', confidence: 0.95 },
  ]);

  assert.deepEqual(result.lines, [
    { text: 'Aadhaar:', confidence: 0.9 },
    { text: 'Account', confidence: 0.8 },
    { text: 'DOB: 14/03/2007', confidence: 0.95 },
  ]);
  assert.equal(result.removedNumbers, 2);
});

test('enforces the backend line and character limits', () => {
  const result = sanitizeLines(
    Array.from({ length: MAX_LINES + 5 }, (_, index) => ({
      text: `${index} ${'x'.repeat(MAX_LINE_CHARS)}`,
      confidence: 0.9,
    })),
  );

  assert.equal(result.lines.length, MAX_LINES);
  assert.ok(result.lines.every((line) => line.text.length <= MAX_LINE_CHARS));
});
