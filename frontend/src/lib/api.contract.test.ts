// Restored from the pre-merge suite (172ec71 src/lib/api.test.ts), ported to the new API module.
import { afterEach, describe, expect, it, vi } from "vitest";

import { compareDocuments, extractDocument, fetchStats, RETRY_BACKOFF_MS } from "./api";
import type { PreparedComparison } from "./backendAdapter";

const contract = (code: string) => ({ error: { code, message: "server text", hint: "server hint" } });
const statsOk: [number, unknown] = [200, { checks: 3, checks_with_mismatch: 1 }];
const compareOk: [number, unknown] = [
  200,
  { summary: { status: "all_match", counts: { blocking: 0, risky: 0, cosmetic: 0 } }, findings: [], fix_plan: [], guidance: [], disclaimer: "d" },
];
const prepared = {
  purpose: "general",
  documents: [
    { doc_type: "pan", fields: { name: "A", dob: null, parent_name: null, gender: null } },
    { doc_type: "passport", fields: { name: "A", dob: null, parent_name: null, gender: null } },
  ],
} as unknown as PreparedComparison;

function respond(...replies: [number, unknown][]) {
  const fn = vi.fn();
  for (const [status, body] of replies) {
    fn.mockResolvedValueOnce(new Response(body === null ? "" : JSON.stringify(body), { status }));
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}

async function settle<T>(p: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return p;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("classification (via GET /v1/stats)", () => {
  it.each([
    // replies, expected code (null = ok)
    [[statsOk], null],
    [[[429, contract("daily_cap_reached")]], "daily_cap_reached"],
    [[[429, contract("throttled")], [429, contract("throttled")]], "throttled"],
    [[[429, { message: "Too Many Requests" }], [429, null]], "throttled"], // bare API Gateway 429
    [[[502, contract("extractor_failed")]], "extractor_failed"], // stats does not retry 502
    [[[503, { message: "Service Unavailable" }], [503, null]], "unexpected"],
    [[[500, null]], "unexpected"],
    [[[403, { Message: "Forbidden" }]], "unexpected"],
    [[[400, { error: { code: "x" } }]], "unexpected"], // incomplete error body
    [[[422, contract("id_number_detected")]], "id_number_detected"],
    [[[200, { nope: 1 }]], "unexpected"], // 2xx with the wrong shape
  ] as [[number, unknown][], string | null][])("%j → %s", async (replies, code) => {
    vi.useFakeTimers();
    respond(...replies);
    const r = await settle(fetchStats());
    if (code === null) expect(r.ok).toBe(true);
    else expect(r.ok === false && r.error.code).toBe(code);
  });

  it("gives every client-side error a message and a hint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const r = await fetchStats();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code === "network" && r.error.message && r.error.hint).toBeTruthy();
  });
});

describe("one quiet retry on busy replies (via POST /v1/compare)", () => {
  it.each([
    ["503 then ok", [[503, { message: "Service Unavailable" }], compareOk], 2, null],
    ["bare 429 then ok", [[429, { message: "Too Many Requests" }], compareOk], 2, null],
    ["contract throttled then ok", [[429, contract("throttled")], compareOk], 2, null],
    ["503 twice", [[503, null], [503, null]], 2, "unexpected"],
    ["429 twice", [[429, null], [429, null]], 2, "throttled"],
    ["daily cap: no retry", [[429, contract("daily_cap_reached")]], 1, "daily_cap_reached"],
    ["502 on compare: no retry", [[502, contract("extractor_failed")]], 1, "extractor_failed"],
    ["400: no retry", [[400, contract("invalid_request")]], 1, "invalid_request"],
  ] as [string, [number, unknown][], number, string | null][])("%s", async (_name, replies, calls, code) => {
    vi.useFakeTimers();
    const fn = respond(...replies);
    const r = await settle(compareDocuments(prepared));
    expect(fn).toHaveBeenCalledTimes(calls);
    if (code === null) expect(r.ok).toBe(true);
    else expect(r.ok === false && r.error.code).toBe(code);
  });

  it("waits at least the backoff before retrying", async () => {
    vi.useFakeTimers();
    const fn = respond([503, null], compareOk);
    const pending = compareDocuments(prepared);
    await vi.advanceTimersByTimeAsync(RETRY_BACKOFF_MS - 1);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(RETRY_BACKOFF_MS); // backoff is at most 1.5x
    expect((await pending).ok).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("sends only purpose and documents to /v1/compare", async () => {
    const fn = respond(compareOk);
    await compareDocuments(prepared);
    expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({ purpose: "general", documents: prepared.documents });
  });
});

describe("POST /v1/extract", () => {
  const extractOk: [number, unknown] = [
    200,
    {
      fields: {
        name: { value: "RAVI", confidence: 0.9 },
        dob: { value: null, confidence: 0, precision: "day" },
        parent_name: { value: null, confidence: 0 },
        gender: { value: null, confidence: 0 },
      },
      warnings: [],
    },
  ];

  it("retries once on 502", async () => {
    vi.useFakeTimers();
    const fn = respond([502, contract("extractor_failed")], extractOk);
    expect((await settle(extractDocument("pan", [{ text: "RAVI", confidence: 0.9 }]))).ok).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry other errors", async () => {
    const fn = respond([422, contract("unreadable")]);
    expect((await extractDocument("pan", [{ text: "RAVI", confidence: 0.9 }])).ok).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it.each([
    [[0.91234, 0.5], { ocr_confidence: [0.91, 0.5] }],
    [[0.9, null], {}], // partial confidence is not sent
  ])("sends only text and confidence (%j)", async (conf, extra) => {
    const fn = respond(extractOk);
    await extractDocument("pan", [
      { text: "RAVI KUMAR", confidence: conf[0] },
      { text: "14/03/2007", confidence: conf[1] },
    ]);
    expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({ doc_type: "pan", ocr_lines: ["RAVI KUMAR", "14/03/2007"], ...extra });
  });
});
