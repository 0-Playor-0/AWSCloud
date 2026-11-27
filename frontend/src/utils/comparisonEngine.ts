import {
  CitizenDocument,
  ComparisonReport,
  DemoPreset,
  DiffSegment,
  FieldComparisonResult,
  FieldKey,
  MatchSeverity,
  PurposeId,
} from '../types/documents';

export const PURPOSE_OPTIONS: {
  id: PurposeId;
  title: string;
  shortHint: string;
  anchorRule: string;
}[] = [
  {
    id: 'general',
    title: 'General check',
    shortHint: 'Compare any 2–6 of your documents.',
    anchorRule:
      'Compares 2–6 records side by side and highlights whichever document differs from the majority.',
  },
  {
    id: 'pan_aadhaar',
    title: 'PAN–Aadhaar linking',
    shortHint: 'Check the fields that must match to link PAN and Aadhaar.',
    anchorRule:
      'PAN–Aadhaar linking fails when Name, Date of Birth (full DD/MM/YYYY), or Gender differ between PAN and Aadhaar.',
  },
  {
    id: 'epf_claim',
    title: 'PF (EPF) claim',
    shortHint: 'Check the fields that often cause EPF claim rejections.',
    anchorRule:
      'EPF claims are commonly rejected when Name, Date of Birth, Aadhaar, or Bank Passbook details do not align.',
  },
];

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'kavya',
    label: "Kavya's sample set",
    subtitle:
      'Initials on one card, full name on another; one document has only a birth year.',
    purpose: 'pan_aadhaar',
    documents: [
      {
        id: 'kavya-aadhaar',
        kind: 'aadhaar',
        label: 'Aadhaar Card',
        shortCode: 'AADHAAR',
        fullName: 'Kavya Nair',
        dob: '1994',
        parentName: 'Suresh Menon Nair',
        gender: 'F',
        confirmed: true,
        isSample: true,
        ocrLines: [
          { id: 'ka1', text: 'Kavya Nair', selected: true, mappedField: 'fullName' },
          { id: 'ka2', text: 'Year of Birth: 1994', selected: true, mappedField: 'dob' },
          { id: 'ka3', text: 'D/O Suresh Menon Nair', selected: true, mappedField: 'parentName' },
          { id: 'ka4', text: 'FEMALE', selected: true, mappedField: 'gender' },
          { id: 'ka5', text: 'Aadhaar No: 4821 9014 7721 (redacted on send)', selected: false },
        ],
      },
      {
        id: 'kavya-pan',
        kind: 'pan',
        label: 'PAN Card',
        shortCode: 'PAN',
        fullName: 'KAVYA S NAIR',
        dob: '18/05/1994',
        parentName: 'SURESH M NAIR',
        gender: 'F',
        confirmed: true,
        isSample: true,
        ocrLines: [
          { id: 'kp1', text: 'KAVYA S NAIR', selected: true, mappedField: 'fullName' },
          { id: 'kp2', text: 'SURESH M NAIR', selected: true, mappedField: 'parentName' },
          { id: 'kp3', text: '18/05/1994', selected: true, mappedField: 'dob' },
        ],
      },
      {
        id: 'kavya-marksheet',
        kind: 'marksheet',
        label: 'Class 10 Marksheet',
        shortCode: 'CLASS 10',
        fullName: 'Kavya Suresh Nair',
        dob: '18-05-1994',
        parentName: 'Suresh Menon Nair',
        gender: 'F',
        confirmed: true,
        isSample: true,
        ocrLines: [
          { id: 'km1', text: 'Candidate: Kavya Suresh Nair', selected: true, mappedField: 'fullName' },
          { id: 'km2', text: 'Father: Suresh Menon Nair', selected: true, mappedField: 'parentName' },
          { id: 'km3', text: 'Date of Birth: 18-05-1994', selected: true, mappedField: 'dob' },
        ],
      },
    ],
  },
  {
    id: 'anita',
    label: "Anita's sample set",
    subtitle: 'Surname changed after marriage; day and month swapped on the passbook.',
    purpose: 'epf_claim',
    documents: [
      {
        id: 'anita-aadhaar',
        kind: 'aadhaar',
        label: 'Aadhaar Card',
        shortCode: 'AADHAAR',
        fullName: 'Anita Kulkarni',
        dob: '08/11/1991',
        parentName: 'Rajesh Kulkarni',
        gender: 'F',
        confirmed: true,
        isSample: true,
        ocrLines: [
          { id: 'aa1', text: 'Anita Kulkarni', selected: true, mappedField: 'fullName' },
          { id: 'aa2', text: 'DOB: 08/11/1991', selected: true, mappedField: 'dob' },
          { id: 'aa3', text: 'W/O Rajesh Kulkarni', selected: true, mappedField: 'parentName' },
          { id: 'aa4', text: 'FEMALE', selected: true, mappedField: 'gender' },
        ],
      },
      {
        id: 'anita-pan',
        kind: 'pan',
        label: 'PAN Card',
        shortCode: 'PAN',
        fullName: 'ANITA DESHPANDE',
        dob: '08/11/1991',
        parentName: 'PRAKASH DESHPANDE',
        gender: 'F',
        confirmed: true,
        isSample: true,
        ocrLines: [
          { id: 'ap1', text: 'ANITA DESHPANDE', selected: true, mappedField: 'fullName' },
          { id: 'ap2', text: 'PRAKASH DESHPANDE', selected: true, mappedField: 'parentName' },
          { id: 'ap3', text: '08/11/1991', selected: true, mappedField: 'dob' },
        ],
      },
      {
        id: 'anita-passbook',
        kind: 'passbook',
        label: 'Bank Passbook',
        shortCode: 'PASSBOOK',
        fullName: 'Anita Kulkarni',
        dob: '11/08/1991',
        parentName: 'Rajesh Kulkarni',
        gender: 'F',
        confirmed: true,
        isSample: true,
        ocrLines: [
          { id: 'ab1', text: 'Account Holder: Anita Kulkarni', selected: true, mappedField: 'fullName' },
          { id: 'ab2', text: 'DOB Recorded: 11/08/1991', selected: true, mappedField: 'dob' },
          { id: 'ab3', text: 'Nominee: Rajesh Kulkarni', selected: true, mappedField: 'parentName' },
        ],
      },
    ],
  },
  {
    id: 'arjun',
    label: "Arjun's sample set",
    subtitle: 'Everything lines up apart from punctuation.',
    purpose: 'general',
    documents: [
      {
        id: 'arjun-aadhaar',
        kind: 'aadhaar',
        label: 'Aadhaar Card',
        shortCode: 'AADHAAR',
        fullName: 'Arjun P. Rao',
        dob: '21/02/1995',
        parentName: 'Prakash V. Rao',
        gender: 'M',
        confirmed: true,
        isSample: true,
        ocrLines: [
          { id: 'ra1', text: 'Arjun P. Rao', selected: true, mappedField: 'fullName' },
          { id: 'ra2', text: 'DOB: 21/02/1995', selected: true, mappedField: 'dob' },
          { id: 'ra3', text: 'S/O Prakash V. Rao', selected: true, mappedField: 'parentName' },
          { id: 'ra4', text: 'MALE', selected: true, mappedField: 'gender' },
        ],
      },
      {
        id: 'arjun-pan',
        kind: 'pan',
        label: 'PAN Card',
        shortCode: 'PAN',
        fullName: 'ARJUN P RAO',
        dob: '21-02-1995',
        parentName: 'PRAKASH V RAO',
        gender: 'M',
        confirmed: true,
        isSample: true,
        ocrLines: [
          { id: 'rp1', text: 'ARJUN P RAO', selected: true, mappedField: 'fullName' },
          { id: 'rp2', text: 'PRAKASH V RAO', selected: true, mappedField: 'parentName' },
          { id: 'rp3', text: '21-02-1995', selected: true, mappedField: 'dob' },
        ],
      },
      {
        id: 'arjun-other',
        kind: 'other',
        label: 'Other / Portal Screenshot',
        shortCode: 'OTHER / PORTAL',
        fullName: 'Arjun P Rao',
        dob: '21/02/1995',
        parentName: 'Prakash V Rao',
        gender: 'M',
        confirmed: true,
        isSample: true,
        ocrLines: [
          { id: 'ro1', text: 'Applicant: Arjun P Rao', selected: true, mappedField: 'fullName' },
          { id: 'ro2', text: 'DOB: 21/02/1995', selected: true, mappedField: 'dob' },
          { id: 'ro3', text: 'Father: Prakash V Rao', selected: true, mappedField: 'parentName' },
          { id: 'ro4', text: 'M', selected: true, mappedField: 'gender' },
        ],
      },
    ],
  },
];

/**
 * Removes long numeric identifiers (such as 12-digit Aadhaar numbers, UANs, or bank account numbers)
 * before any extracted or typed text leaves the device. Dates (DD/MM/YYYY) are preserved.
 */
export function stripLongNumbers(raw: string): { sanitized: string; redactedCount: number } {
  let redactedCount = 0;
  // Match 6+ contiguous digits or grouped Aadhaar-style 4-4-4 digits
  const sanitized = raw
    .replace(/\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g, () => {
      redactedCount += 1;
      return '[REDACTED ID]';
    })
    .replace(/\b\d{6,}\b/g, () => {
      redactedCount += 1;
      return '[REDACTED]';
    })
    .trim();

  return { sanitized, redactedCount };
}

function cleanTokens(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function buildNameDiffSegments(rawValue: string, majorityNormalized: string, isOutlier: boolean): DiffSegment[] | undefined {
  if (!isOutlier || !rawValue.trim() || !majorityNormalized) return undefined;
  const majorityTokens = new Set(majorityNormalized.split(' ').filter(Boolean));
  const parts = rawValue.split(/(\s+)/);

  const segments: DiffSegment[] = parts.map((part) => {
    if (/^\s+$/.test(part)) {
      return { text: part, isDiff: false };
    }
    const normWord = part.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normWord) return { text: part, isDiff: false };
    const isDiff = !majorityTokens.has(normWord);
    return { text: part, isDiff };
  });

  return segments.some((s) => s.isDiff) ? segments : undefined;
}

function normalizeDob(raw: string): { canonical: string; yearOnly: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { canonical: '', yearOnly: false };

  if (/^\d{4}$/.test(trimmed)) {
    return { canonical: trimmed, yearOnly: true };
  }

  const dmy = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return { canonical: `${day}/${month}/${year}`, yearOnly: false };
  }

  const ymd = trimmed.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (ymd) {
    const year = ymd[1];
    const month = ymd[2].padStart(2, '0');
    const day = ymd[3].padStart(2, '0');
    return { canonical: `${day}/${month}/${year}`, yearOnly: false };
  }

  return { canonical: trimmed.toLowerCase(), yearOnly: false };
}

function normalizeGender(raw: string): string {
  const g = raw.trim().toLowerCase();
  if (!g) return '';
  if (g === 'm' || g === 'male') return 'male';
  if (g === 'f' || g === 'female') return 'female';
  if (g === 't' || g === 'o' || g === 'other' || g === 'transgender') return 'other';
  return g;
}

function compareNames(
  values: { docId: string; docLabel: string; shortCode: string; raw: string }[]
): { severity: MatchSeverity; summary: string; outliers: Set<string>; majorityNorm: string } {
  const nonEmpty = values.filter((v) => v.raw.trim().length > 0);
  if (nonEmpty.length < 2) {
    return {
      severity: 'incomplete',
      summary: 'Add values in at least two documents to compare this field.',
      outliers: new Set(),
      majorityNorm: '',
    };
  }

  const normalizedStrings = nonEmpty.map((v) => cleanTokens(v.raw).join(' '));
  const counts = new Map<string, number>();
  normalizedStrings.forEach((s) => counts.set(s, (counts.get(s) || 0) + 1));

  if (counts.size === 1) {
    return {
      severity: 'match',
      summary: 'Exact spelling and word order match across all documents (ignoring casing and punctuation).',
      outliers: new Set(),
      majorityNorm: normalizedStrings[0],
    };
  }

  let majority = normalizedStrings[0];
  let maxCount = 0;
  counts.forEach((c, k) => {
    if (c > maxCount) {
      maxCount = c;
      majority = k;
    }
  });

  const tokenLists = nonEmpty.map((v) => cleanTokens(v.raw));
  const longestTokens = tokenLists.reduce((a, b) => (b.length > a.length ? b : a), tokenLists[0]);

  let onlyInitialVariation = true;
  const outliers = new Set<string>();

  nonEmpty.forEach((v, idx) => {
    const norm = normalizedStrings[idx];
    if (norm !== majority) {
      outliers.add(v.docId);
    }
    const tokens = tokenLists[idx];
    const setLongest = new Set(longestTokens);
    for (const t of tokens) {
      if (setLongest.has(t)) continue;
      const matchesInitial =
        t.length === 1 && longestTokens.some((lt) => lt.startsWith(t));
      const longestHasInitial = longestTokens.some(
        (lt) => lt.length === 1 && t.startsWith(lt)
      );
      if (!matchesInitial && !longestHasInitial) {
        onlyInitialVariation = false;
      }
    }
  });

  if (onlyInitialVariation) {
    return {
      severity: 'variation',
      summary:
        'Same root name, but one or more documents use initials or omit a middle name. Automated portals may flag this.',
      outliers,
      majorityNorm: majority,
    };
  }

  return {
    severity: 'mismatch',
    summary:
      'Spelling, surname, or word order differs between documents. Review before submitting.',
    outliers,
    majorityNorm: majority,
  };
}

function compareDobs(
  values: { docId: string; docLabel: string; shortCode: string; raw: string }[]
): { severity: MatchSeverity; summary: string; outliers: Set<string>; majorityNorm: string } {
  const nonEmpty = values.filter((v) => v.raw.trim().length > 0);
  if (nonEmpty.length < 2) {
    return {
      severity: 'incomplete',
      summary: 'Enter dates of birth in at least two documents to compare.',
      outliers: new Set(),
      majorityNorm: '',
    };
  }

  const parsed = nonEmpty.map((v) => ({
    ...v,
    ...normalizeDob(v.raw),
  }));

  const fullDates = parsed.filter((p) => !p.yearOnly);
  const yearOnlyDocs = parsed.filter((p) => p.yearOnly);

  const fullCounts = new Map<string, number>();
  fullDates.forEach((p) => fullCounts.set(p.canonical, (fullCounts.get(p.canonical) || 0) + 1));

  if (fullCounts.size <= 1 && yearOnlyDocs.length === 0) {
    return {
      severity: 'match',
      summary: 'Date of birth aligns across all documents (formatting differences like / vs - are fine).',
      outliers: new Set(),
      majorityNorm: fullDates[0]?.canonical || '',
    };
  }

  if (fullCounts.size === 1 && yearOnlyDocs.length > 0) {
    const fullYear = fullDates[0].canonical.slice(-4);
    const sameYear = yearOnlyDocs.every((y) => y.canonical === fullYear);
    const outliers = new Set(yearOnlyDocs.map((y) => y.docId));
    if (sameYear) {
      return {
        severity: 'variation',
        summary:
          'Birth year matches, but one document only prints the year instead of DD/MM/YYYY. Full date is required for PAN–Aadhaar linking and EPF.',
        outliers,
        majorityNorm: fullDates[0].canonical,
      };
    }
  }

  let majority = fullDates[0]?.canonical || parsed[0].canonical;
  let maxCount = 0;
  fullCounts.forEach((c, k) => {
    if (c > maxCount) {
      maxCount = c;
      majority = k;
    }
  });

  const outliers = new Set<string>();
  parsed.forEach((p) => {
    if (p.canonical !== majority) {
      outliers.add(p.docId);
    }
  });

  return {
    severity: 'mismatch',
    summary:
      'Conflicting day, month, or year found across documents (e.g. DD/MM vs MM/DD swap). Correct before submission.',
    outliers,
    majorityNorm: majority,
  };
}

function compareGenders(
  values: { docId: string; docLabel: string; shortCode: string; raw: string }[]
): { severity: MatchSeverity; summary: string; outliers: Set<string>; majorityNorm: string } {
  const nonEmpty = values.filter((v) => v.raw.trim().length > 0);
  if (nonEmpty.length < 2) {
    return {
      severity: 'incomplete',
      summary: 'Gender is optional on some cards (like PAN); add at least two values to compare.',
      outliers: new Set(),
      majorityNorm: '',
    };
  }

  const normalized = nonEmpty.map((v) => ({
    ...v,
    norm: normalizeGender(v.raw),
  }));

  const unique = new Set(normalized.map((n) => n.norm));
  if (unique.size === 1) {
    return {
      severity: 'match',
      summary: 'Gender matches consistently across all listed documents.',
      outliers: new Set(),
      majorityNorm: normalized[0].norm,
    };
  }

  const counts = new Map<string, number>();
  normalized.forEach((n) => counts.set(n.norm, (counts.get(n.norm) || 0) + 1));
  let majority = normalized[0].norm;
  let max = 0;
  counts.forEach((c, k) => {
    if (c > max) {
      max = c;
      majority = k;
    }
  });

  const outliers = new Set(
    normalized.filter((n) => n.norm !== majority).map((n) => n.docId)
  );

  return {
    severity: 'mismatch',
    summary: 'Gender entry differs across records and should be aligned before submission.',
    outliers,
    majorityNorm: majority,
  };
}

export function buildComparisonReport(
  documents: CitizenDocument[],
  purpose: PurposeId
): ComparisonReport {
  let redactedNumberCount = 0;

  const sanitizedDocs = documents.map((d) => {
    const fn = stripLongNumbers(d.fullName || '');
    const dob = stripLongNumbers(d.dob || '');
    const pn = stripLongNumbers(d.parentName || '');
    const g = stripLongNumbers(d.gender || '');
    redactedNumberCount += fn.redactedCount + dob.redactedCount + pn.redactedCount + g.redactedCount;
    return {
      ...d,
      fullName: fn.sanitized,
      dob: dob.sanitized,
      parentName: pn.sanitized,
      gender: g.sanitized,
    };
  });

  const fieldDefs: { key: FieldKey; label: string }[] = [
    { key: 'fullName', label: 'Full Name' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'parentName', label: "Parent / Guardian's Name" },
    { key: 'gender', label: 'Gender' },
  ];

  const fields: FieldComparisonResult[] = fieldDefs.map(({ key, label }) => {
    const rawValues = sanitizedDocs.map((d) => ({
      docId: d.id,
      docLabel: d.label,
      shortCode: d.shortCode,
      raw: d[key] || '',
    }));

    const result =
      key === 'dob'
        ? compareDobs(rawValues)
        : key === 'gender'
          ? compareGenders(rawValues)
          : compareNames(rawValues);

    return {
      field: key,
      label,
      severity: result.severity,
      summary: result.summary,
      values: rawValues.map((rv) => {
        const isOutlier = result.outliers.has(rv.docId);
        return {
          docId: rv.docId,
          docLabel: rv.docLabel,
          shortCode: rv.shortCode,
          rawValue: rv.raw || 'Not listed',
          isOutlier,
          diffSegments:
            key === 'fullName' || key === 'parentName'
              ? buildNameDiffSegments(rv.raw, result.majorityNorm, isOutlier)
              : undefined,
        };
      }),
    };
  });

  const matchCount = fields.filter((f) => f.severity === 'match').length;
  const variationCount = fields.filter((f) => f.severity === 'variation').length;
  const mismatchCount = fields.filter((f) => f.severity === 'mismatch').length;

  const overallStatus =
    mismatchCount > 0
      ? 'discrepancy_found'
      : variationCount > 0
        ? 'needs_review'
        : 'aligned';

  const outlierFrequency = new Map<string, number>();
  fields.forEach((f) => {
    f.values.forEach((v) => {
      if (v.isOutlier) {
        outlierFrequency.set(v.docLabel, (outlierFrequency.get(v.docLabel) || 0) + 1);
      }
    });
  });

  let topOutlierDoc = sanitizedDocs[0]?.label || 'Aadhaar Card';
  let topCount = 0;
  outlierFrequency.forEach((cnt, label) => {
    if (cnt > topCount) {
      topCount = cnt;
      topOutlierDoc = label;
    }
  });

  const priorityAction = buildPriorityGuidance(purpose, overallStatus, topOutlierDoc, fields);

  return {
    purpose,
    overallStatus,
    checkedCount: sanitizedDocs.length,
    matchCount,
    variationCount,
    mismatchCount,
    redactedNumberCount,
    fields,
    priorityAction,
    generatedAtLabel: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    resultSource: 'preview',
  };
}

function buildPriorityGuidance(
  purpose: PurposeId,
  status: ComparisonReport['overallStatus'],
  topOutlierDoc: string,
  fields: FieldComparisonResult[]
) {
  if (status === 'aligned') {
    return {
      reviewFirstDoc: 'All listed records are consistent',
      reason:
        'Your core fields match across the checked documents. Punctuation or letter-case differences alone do not block verification.',
      steps: [
        'Keep original documents alongside clear prints ready if offline verification is requested.',
        'Remember: Aadhaar allows only two lifetime name changes and one DOB/gender change — avoid unnecessary edits.',
      ],
    };
  }

  const hasDobIssue = fields.some((f) => f.field === 'dob' && f.severity !== 'match');

  if (purpose === 'pan_aadhaar') {
    return {
      reviewFirstDoc: topOutlierDoc,
      reason:
        'PAN–Aadhaar linking checks Name, full Date of Birth (DD/MM/YYYY), and Gender. Remember: you can change your Aadhaar name only twice in a lifetime and DOB or gender only once.',
      steps: [
        hasDobIssue
          ? 'If Aadhaar prints only your birth year, update Aadhaar or confirm whether PAN matches your Class 10 birth date before linking.'
          : 'Check whether updating PAN is simpler than using up one of your limited Aadhaar demographic updates.',
        `Review ${topOutlierDoc} first alongside your supporting Class 10 certificate.`,
      ],
    };
  }

  if (purpose === 'epf_claim') {
    return {
      reviewFirstDoc: topOutlierDoc,
      reason:
        'EPF claims are commonly rejected when Name, Date of Birth, Aadhaar, or Bank Passbook records differ — especially swapped DD/MM dates or post-marriage surname drift.',
      steps: [
        `Fix ${topOutlierDoc} first if it differs from your UAN/Aadhaar profile (updating a bank passbook KYC or employer joint declaration is often faster than editing Aadhaar).`,
        'Ensure your bank passbook and Aadhaar share the exact same DD/MM/YYYY birth date and spelling.',
      ],
    };
  }

  return {
    reviewFirstDoc: topOutlierDoc,
    reason: `${topOutlierDoc} differs most frequently from your other documents. Checking the outlier first saves extra trips and preserves your limited Aadhaar update attempts.`,
    steps: [
      'Confirm which spelling represents your intended legal name across future forms.',
      `Update ${topOutlierDoc} using a consistent supporting document (keeping in mind Aadhaar allows only 2 name and 1 DOB/gender change in a lifetime).`,
    ],
  };
}
