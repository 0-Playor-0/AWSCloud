import { diffChars } from './diff';
import type {
  CitizenDocument,
  ComparisonReport,
  FieldComparisonResult,
  FieldKey,
  PurposeId,
} from '../types/documents';
import { stripLongNumbers } from '../utils/comparisonEngine';
import type {
  BackendCompareResponse,
  BackendDocType,
  BackendField,
  BackendFinding,
  BackendPurpose,
  BackendSeverity,
} from './backendTypes';

const DOC_TYPES: Record<CitizenDocument['kind'], BackendDocType> = {
  aadhaar: 'aadhaar',
  pan: 'pan',
  marksheet: 'marksheet10',
  passbook: 'passbook',
  passport: 'passport',
  other: 'other',
};

export function toBackendDocType(kind: CitizenDocument['kind']): BackendDocType {
  return DOC_TYPES[kind];
}

const PURPOSES: Record<PurposeId, BackendPurpose> = {
  general: 'general',
  pan_aadhaar: 'pan_aadhaar_link',
  epf_claim: 'epf_claim',
};

const FIELD_KEYS: Record<BackendField, FieldKey> = {
  name: 'fullName',
  dob: 'dob',
  parent_name: 'parentName',
  gender: 'gender',
};

const FIELD_LABELS: Record<FieldKey, string> = {
  fullName: 'Full name',
  dob: 'Date of birth',
  parentName: 'Parent / guardian name',
  gender: 'Gender',
};

export interface PreparedComparison {
  purpose: BackendPurpose;
  documents: Array<{
    doc_type: BackendDocType;
    fields: {
      name: string | null;
      dob: string | null;
      parent_name: string | null;
      gender: 'M' | 'F' | 'O' | null;
    };
  }>;
  backendDocIds: string[];
  redactedNumberCount: number;
}

export class ComparisonInputError extends Error {}

function backendDocIds(documents: CitizenDocument[]): string[] {
  const seen = new Map<BackendDocType, number>();
  return documents.map((document) => {
    const docType = DOC_TYPES[document.kind];
    const count = (seen.get(docType) ?? 0) + 1;
    seen.set(docType, count);
    return count === 1 ? docType : `${docType}_${count}`;
  });
}

function normalizeDob(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const match = value.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!match) throw new ComparisonInputError(`Date of birth is not valid: ${value}`);
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day)
  ) {
    throw new ComparisonInputError(`Date of birth is not valid: ${value}`);
  }
  return `${year}-${month}-${day}`;
}

function normalizeGender(raw: string): 'M' | 'F' | 'O' | null {
  const value = raw.trim().toUpperCase();
  if (!value) return null;
  if (value === 'M' || value === 'MALE') return 'M';
  if (value === 'F' || value === 'FEMALE') return 'F';
  if (value === 'O' || value === 'OTHER' || value === 'TRANSGENDER') return 'O';
  throw new ComparisonInputError(`Gender is not valid: ${raw}`);
}

function cleanText(raw: string): { value: string | null; redacted: number } {
  if (!raw.trim()) return { value: null, redacted: 0 };
  const cleaned = stripLongNumbers(raw);
  return { value: cleaned.sanitized || null, redacted: cleaned.redactedCount };
}

export function prepareComparison(
  purpose: PurposeId,
  documents: CitizenDocument[],
): PreparedComparison {
  if (documents.length < 2 || documents.length > 6) {
    throw new ComparisonInputError('Add between two and six documents.');
  }
  if (documents.some((document) => !document.confirmed)) {
    throw new ComparisonInputError('Confirm every document before comparing.');
  }

  let redactedNumberCount = 0;
  const prepared = documents.map((document) => {
    const name = cleanText(document.fullName);
    const parent = cleanText(document.parentName);
    redactedNumberCount += name.redacted + parent.redacted;
    return {
      doc_type: DOC_TYPES[document.kind],
      fields: {
        name: name.value,
        dob: normalizeDob(document.dob),
        parent_name: parent.value,
        gender: normalizeGender(document.gender),
      },
    };
  });

  if (!prepared.some((document) => Object.values(document.fields).some(Boolean))) {
    throw new ComparisonInputError('Fill in at least one field.');
  }

  return {
    purpose: PURPOSES[purpose],
    documents: prepared,
    backendDocIds: backendDocIds(documents),
    redactedNumberCount,
  };
}

function fieldSeverity(findings: BackendFinding[], provided: number): FieldComparisonResult['severity'] {
  if (findings.some((finding) => finding.severity === 'blocking' || finding.severity === 'risky')) {
    return 'mismatch';
  }
  if (findings.some((finding) => finding.severity === 'cosmetic')) return 'variation';
  return provided >= 2 ? 'match' : 'incomplete';
}

function fieldValue(document: CitizenDocument, field: FieldKey): string {
  if (field === 'fullName') return document.fullName;
  if (field === 'dob') return document.dob;
  if (field === 'parentName') return document.parentName;
  return document.gender;
}

function buildFields(
  documents: CitizenDocument[],
  backendIds: string[],
  findings: BackendFinding[],
): FieldComparisonResult[] {
  return (Object.keys(FIELD_KEYS) as BackendField[]).map((backendField) => {
    const field = FIELD_KEYS[backendField];
    const fieldFindings = findings.filter((finding) => finding.field === backendField);
    const provided = documents.filter((document) => fieldValue(document, field).trim()).length;
    const severity = fieldSeverity(fieldFindings, provided);
    const actionableDocs = new Set(
      fieldFindings
        .filter((finding) => finding.severity === 'blocking' || finding.severity === 'risky')
        .flatMap((finding) => finding.docs),
    );

    let summary = 'The supplied values match across documents.';
    if (severity === 'incomplete') summary = 'Add values in at least two documents to compare this field.';
    if (fieldFindings.length > 0) {
      summary = [...new Set(fieldFindings.map((finding) => finding.explanation))].join(' ');
    }

    // Character-level diff of each flagged value against the first document that has a value
    // (same reference point as the pre-merge receipt report).
    const baselineIndex = documents.findIndex((document) => fieldValue(document, field).trim());
    const baseline = baselineIndex >= 0 ? fieldValue(documents[baselineIndex], field).trim() : '';

    return {
      field,
      label: FIELD_LABELS[field],
      severity,
      summary,
      values: documents.map((document, index) => {
        const raw = fieldValue(document, field);
        const isOutlier = actionableDocs.has(backendIds[index]);
        return {
          docId: document.id,
          docLabel: document.label,
          shortCode: document.shortCode,
          rawValue: raw || 'Not provided',
          isOutlier,
          diffSegments:
            isOutlier && index !== baselineIndex && baseline && raw.trim() && raw.trim() !== baseline
              ? diffChars(baseline, raw.trim()).map((seg) => ({ text: seg.text, isDiff: !seg.same }))
              : undefined,
        };
      }),
    };
  });
}

export function toComparisonReport(
  response: BackendCompareResponse,
  documents: CitizenDocument[],
  purpose: PurposeId,
  redactedNumberCount: number,
): ComparisonReport {
  const fields = buildFields(documents, backendDocIds(documents), response.findings);
  const primaryGuidance =
    response.guidance.find((item) => item.priority === 'review_first') ?? response.guidance[0];
  const primaryFinding = response.findings[0];
  const backendIds = backendDocIds(documents);
  const primaryDocIndex = primaryFinding ? backendIds.indexOf(primaryFinding.docs[0]) : -1;
  const reviewFirstDoc = primaryDocIndex >= 0
    ? documents[primaryDocIndex].label
    : 'No document needs review';
  const steps = primaryGuidance?.steps.length
    ? primaryGuidance.steps
    : response.fix_plan.map((step) => step.action);

  return {
    purpose,
    overallStatus:
      response.summary.status === 'all_match'
        ? 'aligned'
        : response.summary.status === 'minor_differences'
          ? 'needs_review'
          : 'discrepancy_found',
    checkedCount: documents.length,
    matchCount: fields.filter((field) => field.severity === 'match').length,
    variationCount: fields.filter((field) => field.severity === 'variation').length,
    mismatchCount: fields.filter((field) => field.severity === 'mismatch').length,
    redactedNumberCount,
    fields,
    priorityAction: {
      reviewFirstDoc: primaryGuidance?.title ?? reviewFirstDoc,
      reason: primaryGuidance?.summary ?? primaryFinding?.explanation ?? 'All supplied fields align.',
      steps: steps.length ? steps : ['No corrective action is indicated by this comparison.'],
    },
    generatedAtLabel: new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date()),
    resultSource: 'backend',
    guidance: response.guidance,
    fixPlan: response.fix_plan,
    disclaimer: response.disclaimer,
    severityCounts: response.summary.counts,
  };
}

export function severityRank(severity: BackendSeverity): number {
  return severity === 'blocking' ? 0 : severity === 'risky' ? 1 : 2;
}
