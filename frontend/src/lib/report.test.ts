import { describe, expect, it } from "vitest";

import { backendDocumentIds, buildFieldComparisons, fieldComparisonCounts, groupGuidance } from "./report";
import type { DocumentEntry, Finding, GuidanceItem } from "./types";

const doc = (id: string, doc_type: string, fields: Partial<DocumentEntry["fields"]> = {}): DocumentEntry => ({
  id,
  doc_type: doc_type as DocumentEntry["doc_type"],
  source: "typed",
  fields: { name: null, dob: null, parent_name: null, gender: null, ...fields },
});

const finding = (field: Finding["field"]): Finding => ({
  field,
  kind: "spelling_variant",
  severity: "risky",
  docs: ["pan", "passbook"],
  values: { pan: "A", passbook: "B" },
  explanation: "Different",
  rule_ids: [],
});

describe("backendDocumentIds", () => {
  it("adds stable suffixes to repeated document types", () => {
    expect(backendDocumentIds([doc("1", "other"), doc("2", "pan"), doc("3", "other")]))
      .toEqual(["other", "pan", "other_2"]);
  });
});

describe("buildFieldComparisons", () => {
  it("marks fields with a backend finding as different", () => {
    const docs = [doc("1", "pan", { name: "A" }), doc("2", "passbook", { name: "B" })];
    const comparisons = buildFieldComparisons(docs, [finding("name")]);
    expect(comparisons.find((item) => item.field === "name")).toMatchObject({
      state: "difference",
      providedDocIds: ["pan", "passbook"],
    });
  });

  it("marks a field as matched only when at least two documents provide it", () => {
    const docs = [doc("1", "pan", { name: "A" }), doc("2", "passbook", { name: "A" })];
    const comparisons = buildFieldComparisons(docs, []);
    expect(comparisons.find((item) => item.field === "name")?.state).toBe("matched");
    expect(comparisons.find((item) => item.field === "dob")?.state).toBe("not-compared");
    expect(fieldComparisonCounts(comparisons)).toEqual({ matched: 1, different: 0, skipped: 3 });
  });
});

describe("groupGuidance", () => {
  it("groups the same issue while retaining every comparison and unique reference", () => {
    const reference = {
      source_id: "uidai_updates",
      label: "UIDAI",
      url: "https://uidai.gov.in/example",
      authority: "UIDAI",
      status: "verified" as const,
      verified_on: "2026-11-27",
    };
    const item = (finding_index: number): GuidanceItem => ({
      finding_index,
      code: "NAME_DIFFERENT",
      title: "Names differ",
      summary: "Different names",
      priority: "review_first",
      why_it_matters: "A strict service may compare text.",
      recommended_action: "Confirm the record.",
      steps: ["Check the originals."],
      official_references: [reference],
      disclaimer: "General advice only.",
    });
    const groups = groupGuidance([item(0), item(1)], [finding("name"), finding("name")]);
    expect(groups).toHaveLength(1);
    expect(groups[0].comparisons).toHaveLength(2);
    expect(groups[0].references).toHaveLength(1);
  });
});
