import { afterEach, describe, expect, it, vi } from "vitest";

import { classify, compare, extract, RETRY_BACKOFF_MS } from "./api";
import { describeError } from "./errors";
import { docLabel } from "./labels";
import en from "../strings/en.json";

const ok = () => true;
const contract = (code: string) => ({ error: { code, message: "server text", hint: "server hint" } });

describe("classify", () => {
  it.each([
    // status, body, expected code (null = ok)
    [200, { fields: {} }, null],
    [429, contract("daily_cap_reached"), "daily_cap_reached"],
    [429, contract("throttled"), "throttled"],
    [429, { message: "Too Many Requests" }, "throttled"], // bare API Gateway 429
    [429, null, "throttled"],
    [502, contract("extractor_failed"), "extractor_failed"],
    [503, { message: "Service Unavailable" }, "unexpected"],
    [500, null, "unexpected"],
    [403, { Message: "Forbidden" }, "unexpected"],
    [400, { error: { code: "x" } }, "unexpected"], // incomplete error body
    [422, contract("id_number_detected"), "id_number_detected"],
  ])("status %i → %s", (status, body, code) => {
    const r = classify(status, body, ok);
    if (code === null) expect(r.ok).toBe(true);
    else expect(r.ok === false && r.error.code).toBe(code);
  });

  it("treats a 2xx with the wrong shape as unexpected", () => {
    const r = classify(200, { nope: 1 }, () => false);
    expect(r.ok === false && r.error.code).toBe("unexpected");
  });
});

describe("describeError", () => {
  const codes = [
    "id_number_detected", "unreadable", "daily_cap_reached",
    "throttled", "extractor_failed", "invalid_request", "request_too_large", "not_found",
    "internal_error", "network", "unexpected",
  ];
  it.each(codes)("has UI strings for %s", (code) => {
    const shown = describeError({ code, message: "", hint: "" });
    expect(shown.code).toBe(code);
    expect(shown.message).toBe((en as Record<string, string>)[`error.${code}.message`]);
    expect(shown.hint).not.toBe("");
  });

  it("falls back to the server text for an unknown contract code", () => {
    expect(describeError({ code: "new_code", message: "m", hint: "h" })).toEqual({ code: "new_code", message: "m", hint: "h" });
  });

  it("falls back to the generic message when there is no text", () => {
    expect(describeError({ code: "new_code", message: "", hint: "" }).code).toBe("unexpected");
  });
});

describe("docLabel", () => {
  it.each([["pan", "PAN card"], ["other_2", "Other / portal screenshot 2"], ["marksheet10", "Class 10 marksheet"]])(
    "%s → %s", (id, label) => expect(docLabel(id)).toBe(label),
  );
});

describe("requests", () => {
  afterEach(() => vi.unstubAllGlobals());

  const respond = (...replies: [number, unknown][]) => {
    const fn = vi.fn();
    for (const [status, body] of replies) fn.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
    vi.stubGlobal("fetch", fn);
    return fn;
  };

  it.each([
    [[0.91234, 0.5], { ocr_confidence: [0.91, 0.5] }],
    [[0.9, null], {}], // partial confidence is not sent
  ])("sends only text and confidence to /v1/extract (%j)", async (conf, extra) => {
    const fn = respond([200, { fields: {}, warnings: [] }]);
    await extract("pan", [{ text: "RAVI KUMAR", confidence: conf[0] }, { text: "14/03/2007", confidence: conf[1] }]);
    expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({ doc_type: "pan", ocr_lines: ["RAVI KUMAR", "14/03/2007"], ...extra });
  });

  const ok200: [number, unknown] = [200, { summary: {}, findings: [], fix_plan: [], guidance: [] }];
  const docs = [{ id: "a", doc_type: "pan" as const, source: "typed" as const, fields: { name: "A", dob: null, parent_name: null, gender: null } }];

  it.each([
    // replies, expected calls, expected final code (null = ok)
    ["503 then ok", [[503, { message: "Service Unavailable" }], ok200], 2, null],
    ["bare 429 then ok", [[429, { message: "Too Many Requests" }], ok200], 2, null],
    ["contract throttled then ok", [[429, contract("throttled")], ok200], 2, null],
    ["503 twice", [[503, null], [503, null]], 2, "unexpected"],
    ["429 twice", [[429, null], [429, null]], 2, "throttled"],
    ["daily cap: no retry", [[429, contract("daily_cap_reached")]], 1, "daily_cap_reached"],
    ["502 on compare: no retry", [[502, contract("extractor_failed")]], 1, "extractor_failed"],
    ["400: no retry", [[400, contract("invalid_request")]], 1, "invalid_request"],
  ] as [string, [number, unknown][], number, string | null][])(
    "compare: %s", async (_name, replies, calls, code) => {
      vi.useFakeTimers();
      try {
        const fn = respond(...replies);
        const pending = compare("general", docs, {});
        await vi.runAllTimersAsync();
        const r = await pending;
        expect(fn).toHaveBeenCalledTimes(calls);
        if (code === null) expect(r.ok).toBe(true);
        else expect(r.ok === false && r.error.code).toBe(code);
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it("waits at least the backoff before retrying", async () => {
    vi.useFakeTimers();
    try {
      const fn = respond([503, null], ok200);
      const pending = compare("general", docs, {});
      await vi.advanceTimersByTimeAsync(RETRY_BACKOFF_MS - 1);
      expect(fn).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(RETRY_BACKOFF_MS); // backoff is at most 1.5x
      expect((await pending).ok).toBe(true);
      expect(fn).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("retries extract once on 502", async () => {
    const fn = respond([502, contract("extractor_failed")], [200, { fields: {}, warnings: [] }]);
    expect((await extract("pan", [{ text: "RAVI", confidence: 0.9 }])).ok).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry other errors", async () => {
    const fn = respond([422, contract("unreadable")]);
    expect((await extract("pan", [{ text: "RAVI", confidence: 0.9 }])).ok).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("maps a network failure to network", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const r = await extract("pan", [{ text: "RAVI", confidence: 0.9 }]);
    expect(r.ok === false && r.error.code).toBe("network");
  });

  it("sends anchor only when one is set", async () => {
    const fn = respond(
      [200, { summary: {}, findings: [], fix_plan: [], guidance: [] }],
      [200, { summary: {}, findings: [], fix_plan: [], guidance: [] }],
    );
    const docs = [{ id: "a", doc_type: "pan" as const, source: "typed" as const, fields: { name: "A", dob: null, parent_name: null, gender: null } }];
    await compare("general", docs, {});
    await compare("general", docs, { name: "pan" });
    const bodies = fn.mock.calls.map((c) => JSON.parse(c[1].body));
    expect(bodies[0]).not.toHaveProperty("anchor");
    expect(bodies[1].anchor).toEqual({ name: "pan" });
    expect(bodies[0].documents[0]).toEqual({ doc_type: "pan", fields: docs[0].fields }); // no client id sent
  });
});
