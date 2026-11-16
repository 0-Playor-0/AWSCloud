import { afterEach, describe, expect, it, vi } from "vitest";

import { classify, compare, extract } from "./api";
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
    "invalid_image", "image_too_large", "id_number_detected", "unreadable", "daily_cap_reached",
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

  it("retries extract once on 502", async () => {
    const fn = respond([502, contract("extractor_failed")], [200, { fields: {}, warnings: [] }]);
    expect((await extract("pan", "AAAA")).ok).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry other errors", async () => {
    const fn = respond([422, contract("unreadable")]);
    expect((await extract("pan", "AAAA")).ok).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("maps a network failure to network", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const r = await extract("pan", "AAAA");
    expect(r.ok === false && r.error.code).toBe("network");
  });

  it("sends anchor only when one is set", async () => {
    const fn = respond([200, { summary: {}, findings: [], fix_plan: [] }], [200, { summary: {}, findings: [], fix_plan: [] }]);
    const docs = [{ id: "a", doc_type: "pan" as const, source: "typed" as const, fields: { name: "A", dob: null, parent_name: null, gender: null } }];
    await compare("general", docs, {});
    await compare("general", docs, { name: "pan" });
    const bodies = fn.mock.calls.map((c) => JSON.parse(c[1].body));
    expect(bodies[0]).not.toHaveProperty("anchor");
    expect(bodies[1].anchor).toEqual({ name: "pan" });
    expect(bodies[0].documents[0]).toEqual({ doc_type: "pan", fields: docs[0].fields }); // no client id sent
  });
});
