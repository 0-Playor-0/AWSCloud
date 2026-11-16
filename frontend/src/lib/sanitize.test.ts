import { describe, expect, it } from "vitest";

import { MAX_LINE_CHARS, MAX_LINES, sanitizeLines } from "./sanitize";

// Synthetic numbers only.
describe("sanitizeLines", () => {
  it.each([
    ["9999 9999 9999", "", 1],
    ["Aadhaar: 9999-9999-9999 ok", "Aadhaar: ok", 1],
    ["9999  9999 9999", "", 1],
    ["A/c 123456789", "A/c", 1], // 9-digit run
    ["A/c 12345678", "A/c 12345678", 0], // 8 digits kept
    ["VID 1234 5678 9012 3456", "VID 3456", 1],
    ["DOB: 14/03/2007", "DOB: 14/03/2007", 0], // dates kept
    ["DOB: 14-03-2007", "DOB: 14-03-2007", 0],
    ["Year of Birth 1990", "Year of Birth 1990", 0],
    ["XXXX XXXX 9999", "XXXX XXXX 9999", 0], // masked Aadhaar
    ["  RAVI   KUMAR  ", "RAVI KUMAR", 0],
  ])("%s → %s", (input, out, removed) => {
    const r = sanitizeLines([input]);
    expect(r.lines).toEqual(out ? [out] : []);
    expect(r.removedNumbers).toBe(removed);
  });

  it("drops empty lines and enforces the contract limits", () => {
    const r = sanitizeLines(["", "  ", ...Array.from({ length: 50 }, () => "x".repeat(200))]);
    expect(r.lines).toHaveLength(MAX_LINES);
    expect(r.lines.every((l) => l.length === MAX_LINE_CHARS)).toBe(true);
  });
});
