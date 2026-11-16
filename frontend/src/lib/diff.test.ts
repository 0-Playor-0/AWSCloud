import { describe, expect, it } from "vitest";

import { diffChars } from "./diff";

const render = (base: string, other: string) =>
  diffChars(base, other).map((s) => (s.same ? s.text : `[${s.text}]`)).join("");

describe("diffChars", () => {
  it.each([
    ["RAVI KUMAR", "RAVI KUMAR", "RAVI KUMAR"],
    ["POOJA", "PUJA", "P[U]JA"],
    ["RAVI KUMAR", "RAVI KUMAR K", "RAVI KUMAR[ K]"],
    ["RAVI KUMAR", "K. RAVI KUMAR", "[K. ]RAVI KUMAR"],
    ["ANITA SINGH", "ANITA KUMARI SINGH", "ANITA [KUMARI ]SINGH"],
    ["", "ABC", "[ABC]"],
    ["ABC", "", ""],
    ["1990-04-07", "1990-07-04", "1990-0[7]-0[4]"],
  ])("%s vs %s", (base, other, expected) => {
    expect(render(base, other)).toBe(expected);
  });

  it("keeps every character of the compared value, in order", () => {
    for (const [a, b] of [["LAKSHMI", "LAXMI"], ["K RAVI", "RAVI KUMAR"], ["MOHAMMED", "MOHAMMAD"]]) {
      expect(diffChars(a, b).map((s) => s.text).join("")).toBe(b);
    }
  });
});
