import assert from 'node:assert/strict';
import { test } from 'vitest';

import { DEMO_PRESETS } from '../utils/comparisonEngine';
import { prepareComparison, toComparisonReport } from './backendAdapter';
import type { BackendCompareResponse } from './backendTypes';

const preset = DEMO_PRESETS[0];

test('maps the newspaper document model to the backend contract', () => {
  const prepared = prepareComparison(preset.purpose, preset.documents);

  assert.equal(prepared.purpose, 'pan_aadhaar_link');
  assert.equal(prepared.documents[0].doc_type, 'aadhaar');
  assert.equal(prepared.documents[1].doc_type, 'pan');
  assert.equal(prepared.documents[2].doc_type, 'marksheet10');
  assert.equal(prepared.documents[0].fields.dob, '1994');
  assert.equal(prepared.documents[1].fields.dob, '1994-05-18');
  assert.equal(prepared.documents[0].fields.gender, 'F');
});

test('maps the backend response and guidance into the report model', () => {
  const response: BackendCompareResponse = {
    summary: {
      status: 'mismatches_found',
      counts: { blocking: 0, risky: 1, cosmetic: 0 },
    },
    findings: [
      {
        field: 'name',
        kind: 'missing_token',
        severity: 'risky',
        docs: ['aadhaar', 'pan'],
        values: { aadhaar: 'Kavya Nair', pan: 'KAVYA S NAIR' },
        explanation: 'The full names do not contain the same tokens.',
        rule_ids: [],
      },
    ],
    fix_plan: [
      {
        step: 1,
        doc: 'pan',
        action: 'Confirm which document shows your correct full name.',
        caution: null,
        source_url: null,
      },
    ],
    guidance: [
      {
        finding_index: 0,
        code: 'NAME_TOKEN_MISMATCH',
        title: 'Check the full name',
        summary: 'Decide which document shows your correct full name.',
        priority: 'review_first',
        why_it_matters: 'Different names can cause a check to be rejected.',
        recommended_action: 'Confirm the correct name before changing either record.',
        steps: ['Compare both records with the source documents.'],
        official_references: [],
        disclaimer: 'This is advisory guidance, not official verification.',
      },
    ],
    disclaimer: 'Self-check only. Not legal advice.',
  };

  const report = toComparisonReport(response, preset.documents, preset.purpose, 0);

  assert.equal(report.resultSource, 'backend');
  assert.equal(report.overallStatus, 'discrepancy_found');
  assert.equal(report.guidance?.[0].code, 'NAME_TOKEN_MISMATCH');
  assert.equal(report.fixPlan?.[0].step, 1);
  assert.equal(report.fields.find((field) => field.field === 'fullName')?.severity, 'mismatch');
});

test('marks character differences of flagged values against the first document', () => {
  const docs = structuredClone(preset.documents).slice(0, 2);
  docs[0].fullName = 'ANITA SINGH';
  docs[1].fullName = 'ANITA KUMARI SINGH';
  const ids = prepareComparison(preset.purpose, docs).documents.map((d) => d.doc_type);
  const response: BackendCompareResponse = {
    summary: { status: 'mismatches_found', counts: { blocking: 0, risky: 1, cosmetic: 0 } },
    findings: [{ field: 'name', kind: 'missing_token', severity: 'risky', docs: ids,
      values: {}, explanation: 'x', rule_ids: [] }],
    fix_plan: [], guidance: [], disclaimer: 'd',
  };
  const values = toComparisonReport(response, docs, preset.purpose, 0)
    .fields.find((field) => field.field === 'fullName')!.values;
  assert.equal(values[0].diffSegments, undefined); // the reference value itself
  assert.deepEqual(values[1].diffSegments, [
    { text: 'ANITA ', isDiff: false }, { text: 'KUMARI ', isDiff: true }, { text: 'SINGH', isDiff: false },
  ]);
});
