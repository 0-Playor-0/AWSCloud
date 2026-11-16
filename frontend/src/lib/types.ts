// Mirrors the API contract in HANDOFF.md section 3.

export const DOC_TYPES = ["aadhaar", "pan", "marksheet10", "passport", "passbook", "other"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const PURPOSES = ["general", "pan_aadhaar_link", "epf_claim"] as const;
export type Purpose = (typeof PURPOSES)[number];

export const FIELD_NAMES = ["name", "dob", "parent_name", "gender"] as const;
export type FieldName = (typeof FIELD_NAMES)[number];

export type Gender = "M" | "F" | "O";

/** Confirmed fields as sent to /v1/compare. dob is YYYY-MM-DD or YYYY. */
export interface DocFields {
  name: string | null;
  dob: string | null;
  parent_name: string | null;
  gender: Gender | null;
}

export interface DocumentEntry {
  id: string; // client-side only
  doc_type: DocType;
  source: "photo" | "typed" | "sample";
  fields: DocFields;
}

export interface ExtractedField {
  value: string | null;
  confidence: number;
  precision?: "day" | "year";
}

export interface ExtractResponse {
  fields: Record<FieldName, ExtractedField>;
  warnings: string[];
}

export type Severity = "blocking" | "risky" | "cosmetic";

export interface Finding {
  field: FieldName;
  kind: string;
  severity: Severity;
  docs: string[];
  values: Record<string, string>;
  explanation: string;
  rule_ids: string[];
}

export interface FixStep {
  step: number;
  doc: string | null;
  action: string;
  caution: string | null;
  source_url: string | null;
}

export interface CompareResponse {
  summary: {
    status: "all_match" | "minor_differences" | "mismatches_found";
    counts: Record<Severity, number>;
  };
  findings: Finding[];
  fix_plan: FixStep[];
  disclaimer: string;
}

export type Anchor = Partial<Record<FieldName, DocType | null>>;

export interface ApiErrorBody {
  code: string;
  message: string;
  hint: string;
}
