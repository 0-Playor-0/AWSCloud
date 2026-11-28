import type { BackendFixStep, BackendGuidance } from '../lib/backendTypes';

export type SectionId = 'hero' | 'problem' | 'how-it-works' | 'workspace' | 'report';

export type AppLanguage = 'en' | 'hi' | 'mr';

export type PurposeId = 'general' | 'pan_aadhaar' | 'epf_claim';

export type DocumentKind =
  | 'aadhaar'
  | 'pan'
  | 'marksheet'
  | 'passbook'
  | 'passport'
  | 'other';

export interface OcrLine {
  id: string;
  text: string;
  selected: boolean;
  confidence?: number | null;
  mappedField?: 'fullName' | 'dob' | 'parentName' | 'gender';
}

export interface CitizenDocument {
  id: string;
  kind: DocumentKind;
  label: string;
  shortCode: string;
  fullName: string;
  dob: string;
  parentName: string;
  gender: string;
  confirmed: boolean;
  isSample?: boolean;
  ocrLines: OcrLine[];
  uploadedImageUrl?: string;
}

export type FieldKey = 'fullName' | 'dob' | 'parentName' | 'gender';

export type MatchSeverity = 'match' | 'variation' | 'mismatch' | 'incomplete';

export interface DiffSegment {
  text: string;
  isDiff: boolean;
}

export interface DocumentFieldValue {
  docId: string;
  docLabel: string;
  shortCode: string;
  rawValue: string;
  isOutlier: boolean;
  diffSegments?: DiffSegment[];
}

export interface FieldComparisonResult {
  field: FieldKey;
  label: string;
  severity: MatchSeverity;
  summary: string;
  values: DocumentFieldValue[];
  recommendedAnchorDoc?: string;
}

export interface ComparisonReport {
  purpose: PurposeId;
  overallStatus: 'aligned' | 'needs_review' | 'discrepancy_found';
  checkedCount: number;
  matchCount: number;
  variationCount: number;
  mismatchCount: number;
  redactedNumberCount: number;
  fields: FieldComparisonResult[];
  priorityAction: {
    reviewFirstDoc: string;
    reason: string;
    steps: string[];
  };
  generatedAtLabel: string;
  resultSource?: 'preview' | 'backend';
  guidance?: BackendGuidance[];
  fixPlan?: BackendFixStep[];
  disclaimer?: string;
  /** Backend finding counts; only backend results have them (they drive the Health Score). */
  severityCounts?: { blocking: number; risky: number; cosmetic: number };
}

export interface DemoPreset {
  id: string;
  label: string;
  subtitle: string;
  purpose: PurposeId;
  documents: CitizenDocument[];
}
