import assert from 'node:assert/strict';
import test from 'node:test';

import { extractDocument, fetchStats, isCompareResponse } from './api';

test('sends OCR text and confidence only, never an image payload', async () => {
  const originalFetch = globalThis.fetch;
  let sentBody: unknown;
  globalThis.fetch = async (_input, init) => {
    sentBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        fields: {
          name: { value: 'RAVI KUMAR', confidence: 0.91 },
          dob: { value: null, confidence: 0 },
          parent_name: { value: null, confidence: 0 },
          gender: { value: 'M', confidence: 0.88 },
        },
        warnings: [],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };

  try {
    const result = await extractDocument('aadhaar', [
      { text: 'RAVI KUMAR', confidence: 0.91 },
      { text: 'Gender: M', confidence: 0.88 },
    ]);

    assert.equal(result.ok, true);
    assert.deepEqual(sentBody, {
      doc_type: 'aadhaar',
      ocr_lines: ['RAVI KUMAR', 'Gender: M'],
      ocr_confidence: [0.91, 0.88],
    });
    assert.equal(JSON.stringify(sentBody).includes('data:image'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('reads the backend aggregate stats contract', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ checks: 12, checks_with_mismatch: 3 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  try {
    const result = await fetchStats();
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.data, { checks: 12, checks_with_mismatch: 3 });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects a comparison response without the required guidance array', () => {
  assert.equal(
    isCompareResponse({
      summary: { status: 'all_match', counts: { blocking: 0, risky: 0, cosmetic: 0 } },
      findings: [],
      fix_plan: [],
      disclaimer: 'Self-check only.',
    }),
    false,
  );
});
