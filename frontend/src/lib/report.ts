import { FIELD_NAMES, type DocumentEntry, type FieldName, type Finding, type GuidanceItem, type OfficialReference } from "./types";

export type FieldComparisonState = "difference" | "matched" | "not-compared";

export interface FieldComparison {
  field: FieldName;
  state: FieldComparisonState;
  findings: Finding[];
  providedDocIds: string[];
}

/** Match the backend's stable ids for repeated document types (aadhaar, aadhaar_2, ...). */
export function backendDocumentIds(docs: Pick<DocumentEntry, "doc_type">[]): string[] {
  const seen = new Map<string, number>();
  return docs.map((doc) => {
    const count = (seen.get(doc.doc_type) ?? 0) + 1;
    seen.set(doc.doc_type, count);
    return count === 1 ? doc.doc_type : `${doc.doc_type}_${count}`;
  });
}

/**
 * Build a field-level view from backend findings. A field with no finding matched wherever
 * two or more documents supplied a value; missing values are intentionally not compared.
 */
export function buildFieldComparisons(docs: DocumentEntry[], findings: Finding[]): FieldComparison[] {
  const docIds = backendDocumentIds(docs);
  return FIELD_NAMES.map((field) => {
    const fieldFindings = findings.filter((finding) => finding.field === field);
    const providedDocIds = docIds.filter((_, index) => docs[index].fields[field] !== null);
    const state: FieldComparisonState = fieldFindings.length > 0
      ? "difference"
      : providedDocIds.length >= 2
        ? "matched"
        : "not-compared";
    return { field, state, findings: fieldFindings, providedDocIds };
  });
}

export function fieldComparisonCounts(comparisons: FieldComparison[]) {
  return {
    matched: comparisons.filter((item) => item.state === "matched").length,
    different: comparisons.filter((item) => item.state === "difference").length,
    skipped: comparisons.filter((item) => item.state === "not-compared").length,
  };
}

export interface GuidanceGroup {
  item: GuidanceItem;
  comparisons: { findingIndex: number; docs: string[] }[];
  references: OfficialReference[];
}

/** Group identical issue guidance while retaining every related document comparison and reference. */
export function groupGuidance(guidance: GuidanceItem[], findings: Finding[]): GuidanceGroup[] {
  const groups = new Map<string, GuidanceGroup>();
  for (const item of guidance) {
    const finding = findings[item.finding_index];
    let group = groups.get(item.code);
    if (!group) {
      group = { item, comparisons: [], references: [] };
      groups.set(item.code, group);
    }
    group.comparisons.push({ findingIndex: item.finding_index, docs: finding?.docs ?? [] });
    for (const reference of item.official_references) {
      if (!group.references.some((existing) => existing.source_id === reference.source_id)) {
        group.references.push(reference);
      }
    }
  }
  return [...groups.values()];
}
