import { describe, expect, it } from "vitest";

import en from "../strings/en.json";
import hi from "../strings/hi.json";
import mr from "../strings/mr.json";
import { describeError } from "./errors";
import { translate } from "./strings";

const locales = { en, hi, mr };

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

describe("translations", () => {
  it.each(Object.entries(locales))("%s has every English key", (_locale, table) => {
    expect(Object.keys(table).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(Object.entries(locales))("%s preserves every placeholder", (_locale, table) => {
    for (const [key, value] of Object.entries(en)) {
      expect(placeholders(table[key as keyof typeof table]), key).toEqual(placeholders(value));
    }
  });

  it("fills placeholders in the selected language", () => {
    expect(translate("hi", "docs.count", { n: 2 })).toContain("2");
    expect(translate("mr", "docs.count", { n: 2 })).toContain("2");
  });

  it("falls back to English for an unknown key", () => {
    expect(translate("hi", "missing.key")).toBe("missing.key");
  });

  it("uses the selected language for known API errors", () => {
    const error = describeError({ code: "network", message: "", hint: "" }, "hi");
    expect(error.message).toBe(hi["error.network.message"]);
  });
});
