import type { PreparedComparison } from './backendAdapter';
import type {
  BackendCompareResponse,
  BackendDocType,
  BackendField,
  BackendFinding,
  BackendGuidance,
  ExtractResponse,
  StatsResponse,
} from './backendTypes';
import type { RecognizedLine } from './ocr';

const BASE = (import.meta.env?.VITE_API_URL ?? '').replace(/\/$/, '');
const TIMEOUT_MS = 30_000;
export const RETRY_BACKOFF_MS = 800;

export interface ApiErrorBody {
  code: string;
  message: string;
  hint: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: ApiErrorBody };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const BACKEND_FIELDS = new Set<BackendField>(['name', 'dob', 'parent_name', 'gender']);
const BACKEND_SEVERITIES = new Set(['blocking', 'risky', 'cosmetic']);

function isFinding(value: unknown): value is BackendFinding {
  if (!isObject(value)) return false;
  return (
    typeof value.field === 'string' &&
    BACKEND_FIELDS.has(value.field as BackendField) &&
    typeof value.kind === 'string' &&
    typeof value.severity === 'string' &&
    BACKEND_SEVERITIES.has(value.severity) &&
    Array.isArray(value.docs) &&
    value.docs.every((doc) => typeof doc === 'string') &&
    isObject(value.values) &&
    Object.values(value.values).every((fieldValue) => typeof fieldValue === 'string') &&
    typeof value.explanation === 'string' &&
    Array.isArray(value.rule_ids) &&
    value.rule_ids.every((rule) => typeof rule === 'string')
  );
}

function isOfficialReference(value: unknown): boolean {
  if (!isObject(value)) return false;
  return (
    typeof value.source_id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.url === 'string' &&
    value.url.startsWith('https://') &&
    typeof value.authority === 'string' &&
    (value.status === 'verified' || value.status === 'needs_verification') &&
    (value.verified_on === null || typeof value.verified_on === 'string')
  );
}

function isGuidance(value: unknown): value is BackendGuidance {
  if (!isObject(value)) return false;
  return (
    Number.isInteger(value.finding_index) &&
    typeof value.code === 'string' &&
    /^[A-Z][A-Z0-9_]*$/.test(value.code) &&
    typeof value.title === 'string' &&
    typeof value.summary === 'string' &&
    (value.priority === 'optional' || value.priority === 'review' || value.priority === 'review_first') &&
    typeof value.why_it_matters === 'string' &&
    typeof value.recommended_action === 'string' &&
    Array.isArray(value.steps) &&
    value.steps.every((step) => typeof step === 'string') &&
    Array.isArray(value.official_references) &&
    value.official_references.every(isOfficialReference) &&
    typeof value.disclaimer === 'string'
  );
}

function isFixStep(value: unknown): boolean {
  if (!isObject(value)) return false;
  return (
    typeof value.step === 'number' &&
    (value.doc === null || typeof value.doc === 'string') &&
    typeof value.action === 'string' &&
    (value.caution === null || typeof value.caution === 'string') &&
    (value.source_url === null || typeof value.source_url === 'string')
  );
}

export function isCompareResponse(value: unknown): value is BackendCompareResponse {
  if (!isObject(value) || !isObject(value.summary)) return false;
  if (
    value.summary.status !== 'all_match' &&
    value.summary.status !== 'minor_differences' &&
    value.summary.status !== 'mismatches_found'
  ) {
    return false;
  }
  const counts = value.summary.counts;
  return (
    isObject(counts) &&
    ['blocking', 'risky', 'cosmetic'].every(
      (severity) => typeof counts[severity] === 'number',
    ) &&
    Array.isArray(value.findings) &&
    value.findings.every(isFinding) &&
    Array.isArray(value.fix_plan) &&
    value.fix_plan.every(isFixStep) &&
    Array.isArray(value.guidance) &&
    value.guidance.every(isGuidance) &&
    typeof value.disclaimer === 'string'
  );
}

function isExtractResponse(value: unknown): value is ExtractResponse {
  if (
    !isObject(value) ||
    !isObject(value.fields) ||
    !Array.isArray(value.warnings) ||
    !value.warnings.every((warning) => typeof warning === 'string')
  ) {
    return false;
  }
  const fields = value.fields;
  return ['name', 'dob', 'parent_name', 'gender'].every((field) => {
    const extracted = fields[field];
    return (
      isObject(extracted) &&
      (extracted.value === null || typeof extracted.value === 'string') &&
      typeof extracted.confidence === 'number' &&
      Number.isFinite(extracted.confidence) &&
      extracted.confidence >= 0 &&
      extracted.confidence <= 1 &&
      (extracted.precision === undefined ||
        extracted.precision === null ||
        extracted.precision === 'day' ||
        extracted.precision === 'year')
    );
  });
}

function errorBody(value: unknown): ApiErrorBody | null {
  if (!isObject(value) || !isObject(value.error)) return null;
  const error = value.error;
  if (
    typeof error.code !== 'string' ||
    typeof error.message !== 'string' ||
    typeof error.hint !== 'string'
  ) {
    return null;
  }
  return { code: error.code, message: error.message, hint: error.hint };
}

async function requestOnce<T>(
  path: string,
  init: RequestInit,
  valid: (body: unknown) => body is T,
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE}${path}`, { ...init, signal: controller.signal });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error:
          errorBody(body) ?? {
            code: response.status === 429 ? 'throttled' : 'unexpected',
            message: 'The service did not accept the request.',
            hint: 'Please try again in a moment.',
          },
      };
    }
    if (!valid(body)) {
      return {
        ok: false,
        status: response.status,
        error: {
          code: 'unexpected',
          message: 'The service returned an invalid response.',
          hint: 'Please try again in a moment.',
        },
      };
    }
    return { ok: true, data: body };
  } catch {
    return {
      ok: false,
      status: 0,
      error: {
        code: 'network',
        message: 'The service could not be reached.',
        hint: 'Check that the local API is running, then try again.',
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryable(result: ApiResult<unknown>, alsoRetry502 = false): boolean {
  if (result.ok) return false;
  return (
    result.status === 503 ||
    result.error.code === 'throttled' ||
    (alsoRetry502 && result.status === 502)
  );
}

const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function requestJson<T>(
  path: string,
  init: RequestInit,
  valid: (body: unknown) => body is T,
  alsoRetry502 = false,
): Promise<ApiResult<T>> {
  const first = await requestOnce(path, init, valid);
  if (!isRetryable(first, alsoRetry502)) return first;
  await pause(RETRY_BACKOFF_MS * (1 + Math.random() * 0.5));
  return requestOnce(path, init, valid);
}

function postJson(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function compareDocuments(
  prepared: PreparedComparison,
): Promise<ApiResult<BackendCompareResponse>> {
  return requestJson(
    '/v1/compare',
    postJson({ purpose: prepared.purpose, documents: prepared.documents }),
    isCompareResponse,
  );
}

export function extractDocument(
  docType: BackendDocType,
  lines: RecognizedLine[],
): Promise<ApiResult<ExtractResponse>> {
  const confidence = lines.map((line) => line.confidence);
  return requestJson(
    '/v1/extract',
    postJson({
      doc_type: docType,
      ocr_lines: lines.map((line) => line.text),
      ...(confidence.every((value) => value !== null)
        ? { ocr_confidence: confidence.map((value) => Math.round((value ?? 0) * 100) / 100) }
        : {}),
    }),
    isExtractResponse,
    true,
  );
}

export function fetchStats(): Promise<ApiResult<StatsResponse>> {
  return requestJson(
    '/v1/stats',
    { method: 'GET' },
    (body): body is StatsResponse =>
      isObject(body) &&
      typeof body.checks === 'number' &&
      Number.isInteger(body.checks) &&
      body.checks >= 0 &&
      typeof body.checks_with_mismatch === 'number' &&
      Number.isInteger(body.checks_with_mismatch) &&
      body.checks_with_mismatch >= 0,
  );
}
