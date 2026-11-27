export type BackendDocType =
  | 'aadhaar'
  | 'pan'
  | 'marksheet10'
  | 'passbook'
  | 'passport'
  | 'other';

export type BackendPurpose = 'general' | 'pan_aadhaar_link' | 'epf_claim';

export type BackendField = 'name' | 'dob' | 'parent_name' | 'gender';
export type BackendSeverity = 'blocking' | 'risky' | 'cosmetic';

export interface BackendFinding {
  field: BackendField;
  kind: string;
  severity: BackendSeverity;
  docs: string[];
  values: Record<string, string>;
  explanation: string;
  rule_ids: string[];
}

export interface BackendFixStep {
  step: number;
  doc: string | null;
  action: string;
  caution: string | null;
  source_url: string | null;
}

export interface OfficialReference {
  source_id: string;
  label: string;
  url: string;
  authority: string;
  status: 'verified' | 'needs_verification';
  verified_on: string | null;
}

export interface BackendGuidance {
  finding_index: number;
  code: string;
  title: string;
  summary: string;
  priority: 'optional' | 'review' | 'review_first';
  why_it_matters: string;
  recommended_action: string;
  steps: string[];
  official_references: OfficialReference[];
  disclaimer: string;
}

export interface ExtractedField {
  value: string | null;
  confidence: number;
  precision?: 'day' | 'year' | null;
}

export interface ExtractResponse {
  fields: Record<BackendField, ExtractedField>;
  warnings: string[];
}

export interface StatsResponse {
  checks: number;
  checks_with_mismatch: number;
}

export interface BackendCompareResponse {
  summary: {
    status: 'all_match' | 'minor_differences' | 'mismatches_found';
    counts: Record<BackendSeverity, number>;
  };
  findings: BackendFinding[];
  fix_plan: BackendFixStep[];
  guidance: BackendGuidance[];
  disclaimer: string;
}
